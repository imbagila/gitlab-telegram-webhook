import { flattenError } from "zod";
import { gitlabMergeRequestDiffListSchema, type GitlabMergeRequestDiff } from "./diffs.schema.ts";

export async function getMergeRequestDiffs(
  env: Env,
  projectId: number,
  mergeRequestIid: number,
): Promise<GitlabMergeRequestDiff[]> {
  const url = `${env.GITLAB_BASE_URL}/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}/diffs`;

  const response = await fetch(url, {
    method: "GET",
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

  const parsed = gitlabMergeRequestDiffListSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Gitlab API error: invalid response shape (${JSON.stringify(flattenError(parsed.error))})`,
    );
  }

  return parsed.data;
}
