import { z } from "zod";

const gitlabUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  avatar_url: z.string(),
  email: z.string(),
});

const gitlabAssigneeSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  username: z.string(),
  avatar_url: z.string(),
  email: z.string().optional(),
});

const gitlabProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  web_url: z.string(),
  avatar_url: z.string().nullable(),
  git_ssh_url: z.string(),
  git_http_url: z.string(),
  namespace: z.string(),
  visibility_level: z.number(),
  path_with_namespace: z.string(),
  default_branch: z.string(),
  ci_config_path: z.string().nullable(),
  homepage: z.string().optional(),
  url: z.string().optional(),
  ssh_url: z.string().optional(),
  http_url: z.string().optional(),
});

const gitlabLabelSchema = z.object({
  id: z.number(),
  title: z.string(),
  color: z.string(),
  project_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  template: z.boolean(),
  description: z.string().nullable(),
  type: z.string(),
  group_id: z.number().nullable(),
});

const gitlabEscalationPolicySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const gitlabIssueActionSchema = z.enum(["open", "close", "reopen", "update"]);

const gitlabIssueObjectAttributesSchema = z.object({
  action: gitlabIssueActionSchema,
  assignee_ids: z.array(z.number()),
  assignee_id: z.number().nullable().optional(),
  author_id: z.number(),
  closed_at: z.string().nullable().optional(),
  confidential: z.boolean(),
  created_at: z.string(),
  customer_relations_contacts: z.array(z.unknown()).optional(),
  description: z.string(),
  discussion_locked: z.boolean().nullable(),
  due_date: z.string().nullable(),
  start_date: z.string().nullable().optional(),
  duplicated_to_id: z.number().nullable(),
  escalation_policy: gitlabEscalationPolicySchema.optional(),
  escalation_status: z.string().optional(),
  health_status: z.string().nullable().optional(),
  human_time_change: z.string().nullable(),
  human_time_estimate: z.string().nullable(),
  human_total_time_spent: z.string().nullable(),
  id: z.number(),
  iid: z.number(),
  labels: z.array(gitlabLabelSchema),
  last_edited_at: z.string().nullable(),
  last_edited_by_id: z.number().nullable(),
  milestone_id: z.number().nullable(),
  moved_to_id: z.number().nullable(),
  project_id: z.number(),
  relative_position: z.number().nullable(),
  severity: z.string(),
  state: z.string(),
  state_id: z.number(),
  time_change: z.number(),
  time_estimate: z.number(),
  title: z.string(),
  total_time_spent: z.number(),
  type: z.literal("Issue"),
  updated_at: z.string(),
  updated_by_id: z.number().nullable(),
  url: z.string(),
  weight: z.number().nullable().optional(),
});

const gitlabStandardChangeSchema = z.object({
  previous: z.unknown(),
  current: z.unknown(),
});

const gitlabRepositorySchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  homepage: z.string(),
});

export const gitlabIssueWebhookSchema = z.object({
  object_kind: z.literal("issue"),
  event_type: z.literal("issue"),
  user: gitlabUserSchema,
  project: gitlabProjectSchema,
  object_attributes: gitlabIssueObjectAttributesSchema,
  labels: z.array(gitlabLabelSchema),
  changes: z.record(z.string(), gitlabStandardChangeSchema),
  repository: gitlabRepositorySchema.optional(),
  assignees: z.array(gitlabAssigneeSchema),
  assignee: gitlabAssigneeSchema.optional(),
});

export type GitlabIssueWebhook = z.infer<typeof gitlabIssueWebhookSchema>;
