import { flattenError } from "zod";
import { processMergeRequestReview } from "./gitlab/merge_request_review.ts";
import type { MergeRequestReviewMessage } from "./gitlab/merge_request_review.queue.ts";
import { gitlabWebhookSchema } from "./gitlab/webhook/schema.ts";

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch (e) {
      return Response.json({ message: `invalid url: ${request.url}`, error: e }, { status: 400 });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/" && request.method !== "POST") {
      return Response.json({ message: "method not allowed" }, { status: 405 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ message: "invalid json", error: e }, { status: 400 });
    }

    const parsed = gitlabWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: flattenError(parsed.error) }, { status: 400 });
    }

    const webhook = parsed.data;
    if (webhook.object_kind !== "merge_request") {
      return Response.json({ error: "unsupported object_kind" }, { status: 422 });
    }

    const { object_attributes, project } = webhook;

    if (object_attributes.action !== "open" && object_attributes.action !== "reopen") {
      return Response.json({ status: "ok", skipped: true });
    }

    const message: MergeRequestReviewMessage = {
      projectId: project.id,
      mrIid: object_attributes.iid,
    };

    try {
      await env.MERGE_REQUEST_REVIEW_QUEUE.send(message);
    } catch (error) {
      console.error("Failed to enqueue merge request review:", error);
      return Response.json({ error: "failed to enqueue review" }, { status: 500 });
    }

    return Response.json({ status: "accepted" });
  },

  async queue(batch: MessageBatch<MergeRequestReviewMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { projectId, mrIid } = message.body;

      try {
        await processMergeRequestReview(env, projectId, mrIid);
      } catch (error) {
        console.error("Merge request review failed:", error);
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env, MergeRequestReviewMessage>;
