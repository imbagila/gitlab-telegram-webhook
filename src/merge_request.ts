import { z } from "zod";

const gitlabUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  avatar_url: z.string(),
  email: z.string(),
});

const gitlabReviewerSchema = gitlabUserSchema.extend({
  state: z
    .enum([
      "unreviewed",
      "review_started",
      "reviewed",
      "requested_changes",
      "approved",
      "unapproved",
    ])
    .optional(),
  re_requested: z.boolean().optional(),
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

const gitlabProjectRefSchema = gitlabProjectSchema.partial({ id: true });

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

const gitlabLastCommitSchema = z.object({
  id: z.string(),
  message: z.string(),
  title: z.string(),
  timestamp: z.string(),
  url: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

const gitlabMergeRequestActionSchema = z.enum([
  "open",
  "close",
  "reopen",
  "update",
  "approval",
  "approved",
  "unapproval",
  "unapproved",
  "merge",
]);

const gitlabSystemActionSchema = z.enum([
  "approvals_reset_on_push",
  "code_owner_approvals_reset_on_push",
]);

const gitlabMergeRequestObjectAttributesSchema = z.object({
  action: gitlabMergeRequestActionSchema,
  actioned_at: z.string().optional(),
  approval_rules: z.array(z.record(z.string(), z.unknown())).optional(),
  assignee_ids: z.array(z.number()),
  assignee_id: z.number().nullable().optional(),
  author_id: z.number(),
  blocking_discussions_resolved: z.boolean(),
  created_at: z.string(),
  description: z.string(),
  detailed_merge_status: z.string(),
  draft: z.boolean(),
  first_contribution: z.boolean(),
  head_pipeline_id: z.number().nullable(),
  human_time_change: z.string().nullable(),
  human_time_estimate: z.string().nullable(),
  human_total_time_spent: z.string().nullable(),
  id: z.number(),
  iid: z.number(),
  labels: z.array(gitlabLabelSchema),
  last_commit: gitlabLastCommitSchema,
  last_edited_at: z.string().nullable(),
  last_edited_by_id: z.number().nullable(),
  merge_commit_sha: z.string().nullable(),
  merged_at: z.string().nullable().optional(),
  merge_error: z.string().nullable(),
  merge_params: z.record(z.string(), z.string()),
  merge_status: z.string().optional(),
  merge_user_id: z.number().nullable(),
  merge_when_pipeline_succeeds: z.boolean(),
  milestone_id: z.number().nullable(),
  oldrev: z.string().optional(),
  prepared_at: z.string().nullable().optional(),
  reviewer_ids: z.array(z.number()),
  source_branch: z.string(),
  source: gitlabProjectRefSchema,
  source_project_id: z.number(),
  squash_commit_sha: z.string().nullable().optional(),
  state_id: z.number(),
  state: z.string(),
  system: z.boolean(),
  system_action: gitlabSystemActionSchema.optional(),
  target_branch: z.string(),
  target: gitlabProjectRefSchema,
  target_project_id: z.number(),
  time_change: z.number(),
  time_estimate: z.number(),
  title: z.string(),
  total_time_spent: z.number(),
  updated_at: z.string(),
  updated_by_id: z.number().nullable(),
  url: z.string(),
  work_in_progress: z.boolean().optional(),
});

const gitlabStandardChangeSchema = z.object({
  previous: z.unknown(),
  current: z.unknown(),
});

const gitlabReviewerChangeSchema = z.tuple([
  z.array(gitlabReviewerSchema),
  z.array(gitlabReviewerSchema),
]);

const gitlabChangeValueSchema = z.union([
  gitlabStandardChangeSchema,
  gitlabReviewerChangeSchema,
]);

const gitlabRepositorySchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  homepage: z.string(),
});

export const gitlabMergeRequestWebhookSchema = z.object({
  object_kind: z.literal("merge_request"),
  event_type: z.literal("merge_request"),
  user: gitlabUserSchema,
  project: gitlabProjectSchema,
  object_attributes: gitlabMergeRequestObjectAttributesSchema,
  labels: z.array(gitlabLabelSchema),
  changes: z.record(z.string(), gitlabChangeValueSchema),
  repository: gitlabRepositorySchema.optional(),
  assignees: z.array(gitlabUserSchema),
  reviewers: z.array(gitlabReviewerSchema),
});

export type GitlabMergeRequestWebhook = z.infer<
  typeof gitlabMergeRequestWebhookSchema
>;
