import { z } from "zod";
import { gitlabIssueWebhookSchema } from "./issue.schema.ts";
import { gitlabMergeRequestWebhookSchema } from "./merge_request.schema.ts";

export const gitlabWebhookSchema = z.discriminatedUnion("object_kind", [
  gitlabIssueWebhookSchema,
  gitlabMergeRequestWebhookSchema,
]);

export type GitlabWebhook = z.infer<typeof gitlabWebhookSchema>;
