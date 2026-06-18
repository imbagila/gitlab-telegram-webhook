import { flattenError } from "zod";
import { gitlabIssueWebhookSchema } from "./issue.ts";
import { gitlabMergeRequestWebhookSchema } from "./merge_request.ts";
import { formatWebhookBody, sendTelegramMessage } from "./telegram.ts";

function missingTelegramConfig(): Response {
  return Response.json(
    { error: "telegram not configured" },
    { status: 500 },
  );
}

async function forwardToTelegram(
  env: Env,
  body: unknown,
  kind: string,
): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return missingTelegramConfig();
  }

  const result = await sendTelegramMessage(
    env,
    formatWebhookBody(body),
  );

  if (result.ok === false) {
    return Response.json(
      { error: "telegram send failed", detail: result.description },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, kind });
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
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

    return forwardToTelegram(env, body, "issue");
  }

  if (objectKind === "merge_request") {
    const parsed = gitlabMergeRequestWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: flattenError(parsed.error) }, { status: 400 });
    }

    return forwardToTelegram(env, body, "merge_request");
  }

  return Response.json({ error: "unsupported object_kind" }, { status: 422 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
