export async function getDiff(env: Env, projectId: number, filePath: string): Promise<string> {
  const url = `${env.GITLAB_BASE_URL}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "PRIVATE-TOKEN": env.GITLAB_TOKEN,
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`Gitlab API error (${response.status}): ${response.statusText}`);
  }

  return response.text();
}
