import { flattenError } from "zod";
import { gitlabIssueWebhookSchema } from "./issue.ts";
import { gitlabMergeRequestWebhookSchema } from "./merge_request.ts";

const port = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port,
  routes: {
    "/": {
      GET: () => Response.json({ status: "ok" }),
      POST: async (req) => {
        let body: unknown;

        try {
          body = await req.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }

        if (typeof body !== "object" || body === null || !("object_kind" in body)) {
          return Response.json({ error: "missing object_kind" }, { status: 400 });
        }

        const objectKind = (body as { object_kind: unknown }).object_kind;

        if (objectKind === "issue") {
          const parsed = gitlabIssueWebhookSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json({ error: flattenError(parsed.error) }, { status: 400 });
          }

          // TODO: forward to Telegram
          return Response.json({ ok: true, kind: "issue" });
        }

        if (objectKind === "merge_request") {
          const parsed = gitlabMergeRequestWebhookSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json({ error: flattenError(parsed.error) }, { status: 400 });
          }

          // TODO: forward to Telegram
          return Response.json({ ok: true, kind: "merge_request" });
        }

        return Response.json({ error: "unsupported object_kind" }, { status: 422 });
      },
    },
  },

  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
