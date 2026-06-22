import { flattenError } from "zod";
import { gitlabMergeRequestSchema, type GitlabMergeRequest } from "./merge_request.schema";

export async function getMergeRequest(env: Env, projectId: number, mergeRequestId: number): Promise<GitlabMergeRequest> {
    const url = `${env.GITLAB_BASE_URL}/api/v4/projects/${projectId}/merge_requests/${mergeRequestId}`;
  
    // get merge request
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": env.GITLAB_TOKEN,
        "Accept": "application/json",
      },
    });
  
    // check if response is ok
    if (!response.ok) {
      throw new Error(`Gitlab API error (${response.status}): ${response.statusText}`);
    }
  
    // parse response body to json
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("Gitlab API error: invalid JSON response");
    }
  
    // parse response body to schema
    const parsed = gitlabMergeRequestSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Gitlab API error: invalid response shape (${JSON.stringify(flattenError(parsed.error))})`,
      );
    }
  
    return parsed.data;
  }
  