import { flattenError } from "zod";
import { telegramSendMessageResponseSchema, type TelegramMessage } from "./send_message.schema.ts";

export async function sendMessage(env: Env, message: string): Promise<TelegramMessage> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  // send message to telegram
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
    }),
  });

  // check if response is ok
  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status}`);
  }

  // parse response body to json
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Telegram API error: invalid JSON response");
  }

  // parse response body to schema
  const parsed = telegramSendMessageResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Telegram API error: invalid response shape (${JSON.stringify(flattenError(parsed.error))})`,
    );
  }

  // check if result is ok
  const result = parsed.data;
  if (result.ok === false) {
    throw new Error(
      `Telegram API error (${result.error_code}): ${result.description}`,
    );
  }

  return result.result;
}
