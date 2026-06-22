import { z } from "zod";

export const gitlabMergeRequestDiffSchema = z.object({
  old_path: z.string(),
  new_path: z.string(),
  a_mode: z.string(),
  b_mode: z.string(),
  diff: z.string(),
  collapsed: z.boolean(),
  too_large: z.boolean(),
  new_file: z.boolean(),
  renamed_file: z.boolean(),
  deleted_file: z.boolean(),
  generated_file: z.boolean(),
});

export const gitlabMergeRequestDiffListSchema = z.array(
  gitlabMergeRequestDiffSchema,
);

export type GitlabMergeRequestDiff = z.infer<
  typeof gitlabMergeRequestDiffSchema
>;
