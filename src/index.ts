import { flattenError } from "zod";
import { gitlabWebhookSchema } from "./gitlab/webhook/schema.ts";
import { sendMessage } from "./telegram/send_message.api.ts";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // parse url
    let url: URL;
    try {
      url = new URL(request.url);
    } catch (e) {
      return Response.json({ message: `invalid url: ${request.url}`, error: e }, { status: 400 });
    }

    // healthcheck
    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ status: "ok" });
    }

    // handling webhook
    if (url.pathname === "/" && request.method === "POST") {
      // parse request body to json
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
        await sendMessage(env, webhook.object_attributes.title);
        return Response.json({ status: "ok" });
      } else if (webhook.object_kind === "merge_request") {
        await sendMessage(env, webhook.object_attributes.title);
        return Response.json({ status: "ok" });
      } else {
        return Response.json({ error: "unsupported object_kind" }, { status: 422 });
      }
    } else {
      return Response.json({ message: "not found" }, { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>;
