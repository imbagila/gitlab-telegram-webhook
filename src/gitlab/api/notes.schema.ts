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

export const gitlabNoteSchema = z.object({
  id: z.number(),
  type: z.string().nullable(),
  body: z.string(),
  author: gitlabApiUserSchema,
  created_at: z.string(),
  updated_at: z.string(),
  system: z.boolean(),
  noteable_id: z.number(),
  noteable_type: z.string(),
  project_id: z.number(),
  resolvable: z.boolean(),
  confidential: z.boolean(),
  internal: z.boolean(),
  imported: z.boolean(),
  imported_from: z.string(),
  noteable_iid: z.number(),
  commands_changes: z.record(z.string(), z.unknown()),
});

export type GitlabNote = z.infer<typeof gitlabNoteSchema>;
