import { z } from "zod";

const gitlabApiUserStateSchema = z.enum(["active", "blocked", "deactivated"]);

const gitlabApiUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  state: gitlabApiUserStateSchema,
  avatar_url: z.string().nullable(),
  web_url: z.string(),
  locked: z.boolean().optional(),
  public_email: z.string().nullable().optional(),
});

const gitlabApiLabelDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable(),
  description_html: z.string().nullable(),
  text_color: z.string(),
  archived: z.boolean().optional(),
});

const gitlabApiLabelSchema = z.union([
  z.string(),
  gitlabApiLabelDetailSchema,
]);

const gitlabApiMilestoneSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number().optional(),
  group_id: z.number().optional(),
  title: z.string(),
  description: z.string().nullable(),
  state: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  due_date: z.string().nullable(),
  start_date: z.string().nullable(),
  expired: z.boolean().optional(),
  web_url: z.string(),
});

const gitlabApiReferencesSchema = z.object({
  short: z.string(),
  relative: z.string(),
  full: z.string(),
});

const gitlabApiTimeStatsSchema = z.object({
  time_estimate: z.number(),
  total_time_spent: z.number(),
  human_time_estimate: z.string().nullable(),
  human_total_time_spent: z.string().nullable(),
});

const gitlabApiTaskCompletionStatusSchema = z.object({
  count: z.number(),
  completed_count: z.number(),
});

const gitlabApiDiffRefsSchema = z.object({
  base_sha: z.string(),
  start_sha: z.string(),
  head_sha: z.string(),
});

const gitlabApiPipelineIllustrationSchema = z.object({
  content: z.string(),
  image: z.string(),
  size: z.string(),
  title: z.string(),
});

const gitlabApiPipelineActionSchema = z.object({
  button_title: z.string(),
  confirmation_message: z.string().optional(),
  icon: z.string(),
  method: z.string(),
  path: z.string(),
  title: z.string(),
});

const gitlabApiPipelineDetailedStatusSchema = z.object({
  icon: z.string(),
  text: z.string(),
  label: z.string(),
  group: z.string(),
  tooltip: z.string(),
  has_details: z.boolean(),
  details_path: z.string(),
  favicon: z.string().optional(),
  illustration: gitlabApiPipelineIllustrationSchema.nullable().optional(),
  action: gitlabApiPipelineActionSchema.optional(),
});

const gitlabApiPipelineSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number(),
  sha: z.string(),
  ref: z.string(),
  status: z.string(),
  source: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  web_url: z.string(),
  before_sha: z.string().optional(),
  tag: z.boolean().optional(),
  yaml_errors: z.string().nullable().optional(),
  user: gitlabApiUserSchema.optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  committed_at: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  queued_duration: z.number().nullable().optional(),
  coverage: z.number().nullable().optional(),
  detailed_status: gitlabApiPipelineDetailedStatusSchema.optional(),
  archived: z.boolean().optional(),
});

const gitlabApiMergeRequestStateSchema = z.enum([
  "opened",
  "closed",
  "merged",
  "locked",
]);

const gitlabApiDetailedMergeStatusSchema = z.enum([
  "approvals_syncing",
  "checking",
  "ci_must_pass",
  "ci_still_running",
  "commits_status",
  "conflict",
  "discussions_not_resolved",
  "draft_status",
  "jira_association_missing",
  "mergeable",
  "merge_request_blocked",
  "merge_time",
  "need_rebase",
  "not_approved",
  "not_open",
  "preparing",
  "requested_changes",
  "security_policy_pipeline_check",
  "security_policy_violations",
  "status_checks_must_pass",
  "unchecked",
  "locked_paths",
  "locked_lfs_files",
  "title_regex",
]);

const gitlabApiMergeRequestPermissionsSchema = z.object({
  can_merge: z.boolean(),
});

export const gitlabMergeRequestSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string(),
  state: gitlabApiMergeRequestStateSchema,
  imported: z.boolean(),
  imported_from: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  merged_by: gitlabApiUserSchema.nullable().optional(),
  merge_user: gitlabApiUserSchema.nullable(),
  merged_at: z.string().nullable(),
  merge_after: z.string().nullable().optional(),
  prepared_at: z.string().nullable().optional(),
  closed_by: gitlabApiUserSchema.nullable(),
  closed_at: z.string().nullable(),
  target_branch: z.string(),
  source_branch: z.string(),
  user_notes_count: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
  author: gitlabApiUserSchema,
  assignees: z.array(gitlabApiUserSchema),
  assignee: gitlabApiUserSchema.nullable().optional(),
  reviewers: z.array(gitlabApiUserSchema),
  source_project_id: z.number(),
  target_project_id: z.number(),
  labels: z.array(gitlabApiLabelSchema),
  draft: z.boolean(),
  work_in_progress: z.boolean().optional(),
  milestone: gitlabApiMilestoneSchema.nullable(),
  merge_when_pipeline_succeeds: z.boolean(),
  merge_status: z.string().optional(),
  detailed_merge_status: gitlabApiDetailedMergeStatusSchema,
  sha: z.string(),
  merge_commit_sha: z.string().nullable(),
  squash_commit_sha: z.string().nullable(),
  discussion_locked: z.boolean().nullable(),
  should_remove_source_branch: z.boolean().nullable(),
  force_remove_source_branch: z.boolean(),
  allow_collaboration: z.boolean().optional(),
  allow_maintainer_to_push: z.boolean().optional(),
  reference: z.string().optional(),
  references: gitlabApiReferencesSchema,
  web_url: z.string(),
  time_stats: gitlabApiTimeStatsSchema,
  squash: z.boolean(),
  squash_on_merge: z.boolean().optional(),
  task_completion_status: gitlabApiTaskCompletionStatusSchema,
  has_conflicts: z.boolean(),
  blocking_discussions_resolved: z.boolean(),
  approvals_before_merge: z
    .union([z.number(), z.record(z.string(), z.unknown())])
    .nullable()
    .optional(),
  subscribed: z.boolean().optional(),
  changes_count: z.string().optional(),
  latest_build_started_at: z.string().nullable().optional(),
  latest_build_finished_at: z.string().nullable().optional(),
  first_deployed_to_production_at: z.string().nullable().optional(),
  first_contribution: z.boolean().optional(),
  pipeline: gitlabApiPipelineSchema.nullable().optional(),
  head_pipeline: gitlabApiPipelineSchema.nullable().optional(),
  diff_refs: gitlabApiDiffRefsSchema.optional(),
  diverged_commits_count: z.number().optional(),
  merge_error: z.string().nullable().optional(),
  rebase_in_progress: z.boolean().optional(),
  user: gitlabApiMergeRequestPermissionsSchema.optional(),
  title_html: z.string().optional(),
  description_html: z.string().optional(),
});

export type GitlabMergeRequest = z.infer<typeof gitlabMergeRequestSchema>;
