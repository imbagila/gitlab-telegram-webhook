import { flattenError } from "zod";
import { gitlabWebhookSchema } from "./gitlab/webhook/schema.ts";
import { processMergeRequestReview } from "./gitlab/merge_request_review.ts";
import { sendMessage } from "./telegram/send_message.api.ts";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch (e) {
      return Response.json({ message: `invalid url: ${request.url}`, error: e }, { status: 400 });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/" && request.method === "POST") {
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

      if (webhook.object_kind === "issue") {
        const { object_attributes } = webhook;
        await sendMessage(env, `New issue: ${object_attributes.title}\n${object_attributes.url}`);
        return Response.json({ status: "ok" });
      }

      if (webhook.object_kind === "merge_request") {
        const { object_attributes, project } = webhook;

        if (object_attributes.action !== "open" && object_attributes.action !== "reopen") {
          return Response.json({ status: "ok", skipped: true });
        }

        ctx.waitUntil(
          processMergeRequestReview(env, project.id, object_attributes.iid).catch((error) => {
            console.error("Merge request review failed:", error);
          }),
        );

        return Response.json({ status: "accepted" });
      }

      return Response.json({ error: "unsupported object_kind" }, { status: 422 });
    }

    return Response.json({ message: "not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
