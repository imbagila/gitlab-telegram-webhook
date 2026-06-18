const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatWebhookBody(body: unknown): string {
  const objectKind =
    typeof body === "object" &&
    body !== null &&
    "object_kind" in body &&
    typeof body.object_kind === "string"
      ? body.object_kind
      : "webhook";

  const json = JSON.stringify(body, null, 2);
  const header = `<b>GitLab ${escapeHtml(objectKind)}</b>\n<pre>`;
  const footer = "</pre>";
  const maxJsonLength =
    TELEGRAM_MAX_MESSAGE_LENGTH - header.length - footer.length - 1;

  let content = escapeHtml(json);
  if (content.length > maxJsonLength) {
    content = `${content.slice(0, maxJsonLength - 3)}...`;
  }

  return header + content + footer;
}

export async function sendTelegramMessage(
  env: Pick<Env, "TELEGRAM_BOT_TOKEN" | "TELEGRAM_CHAT_ID">,
  text: string,
): Promise<{ ok: true } | { ok: false; status: number; description: string }> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    description?: string;
  };

  if (!response.ok || !result.ok) {
    return {
      ok: false as const,
      status: response.status,
      description: result.description ?? "telegram send failed",
    };
  }

  return { ok: true as const };
}
