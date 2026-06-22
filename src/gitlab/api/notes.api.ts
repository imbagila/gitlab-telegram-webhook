import { flattenError } from "zod";
import { gitlabNoteSchema, type GitlabNote } from "./notes.schema.ts";

export async function createMergeRequestNote(
  env: Env,
  projectId: number,
  mergeRequestIid: number,
  body: string,
): Promise<GitlabNote> {
  const url = `${env.GITLAB_BASE_URL}/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}/notes?body=${body}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "PRIVATE-TOKEN": env.GITLAB_TOKEN,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Gitlab API error (${response.status}): ${response.statusText}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Gitlab API error: invalid JSON response");
  }

  const parsed = gitlabNoteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Gitlab API error: invalid response shape (${JSON.stringify(flattenError(parsed.error))})`,
    );
  }

  return parsed.data;
}
