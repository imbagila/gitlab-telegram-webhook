export async function getDiff(env: Env, projectId: number, filePath: string): Promise<string> {
  const url = `https://gitlab.spesolution.net/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw`;

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
