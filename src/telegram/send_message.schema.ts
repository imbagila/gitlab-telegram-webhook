import { z } from "zod";

const telegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  username: z.string().optional(),
});

const telegramAcceptedGiftTypesSchema = z.object({
  unlimited_gifts: z.boolean(),
  limited_gifts: z.boolean(),
  unique_gifts: z.boolean(),
  premium_subscription: z.boolean(),
  gifts_from_channels: z.boolean(),
});

const telegramChatSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  type: z.string(),
  all_members_are_administrators: z.boolean().optional(),
  accepted_gift_types: telegramAcceptedGiftTypesSchema.optional(),
});

const telegramMessageSchema = z.object({
  message_id: z.number(),
  from: telegramUserSchema.optional(),
  chat: telegramChatSchema,
  date: z.number(),
  text: z.string().optional(),
});

const telegramSendMessageSuccessSchema = z.object({
  ok: z.literal(true),
  result: telegramMessageSchema,
});

const telegramSendMessageErrorSchema = z.object({
  ok: z.literal(false),
  error_code: z.number(),
  description: z.string(),
});

export const telegramSendMessageResponseSchema = z.discriminatedUnion("ok", [
  telegramSendMessageSuccessSchema,
  telegramSendMessageErrorSchema,
]);

export type TelegramSendMessageResponse = z.infer<
  typeof telegramSendMessageResponseSchema
>;

export type TelegramMessage = z.infer<typeof telegramMessageSchema>;
