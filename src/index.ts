import { flattenError } from "zod";
import { gitlabWebhookSchema } from "./gitlab/webhook/schema.ts";
import { sendMessage } from "./telegram/send_message.api.ts";
import { getMergeRequest } from "./gitlab/api/merge_request.api.ts";
import { getMergeRequestDiffs } from "./gitlab/api/diffs.api.ts";
import { OpenRouter } from "@openrouter/sdk";

const MAX_DIFF_CHARS = 8000;
const MAX_TELEGRAM_CHARS = 4000;

function buildCodeReviewPrompt(
  title: string,
  description: string,
  authorName: string,
  authorUsername: string,
  sourceBranch: string,
  targetBranch: string,
  diffText: string,
): string {
  return `You are a senior software engineer performing a code review. Be concise and constructive.

Merge Request: ${title}
Author: ${authorName} (@${authorUsername})
Branch: ${sourceBranch} → ${targetBranch}
Description: ${description || "(none)"}

Changes:
${diffText}

Provide a brief code review with these sections:
1. Summary - what the changes do
2. Issues - bugs, security problems, or concerns (skip if none)
3. Suggestions - code quality improvements (skip if none)
4. Verdict: LGTM / REQUEST CHANGES / COMMENT`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch (e) {
      return Response.json({ message: `invalid url: ${request.url}`, error: e }, { status: 400 });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/" && request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch (e) {
        return Response.json({ message: "invalid json", error: e }, { status: 400 });
      }

      const parsed = gitlabWebhookSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: flattenError(parsed.error) }, { status: 400 });
      }

      const webhook = parsed.data;

      if (webhook.object_kind === "issue") {
        const { object_attributes } = webhook;
        await sendMessage(env, `New issue: ${object_attributes.title}\n${object_attributes.url}`);
        return Response.json({ status: "ok" });
      }

      if (webhook.object_kind === "merge_request") {
        const { object_attributes, project } = webhook;

        // Only trigger a review when the MR is opened or reopened
        if (object_attributes.action !== "open" && object_attributes.action !== "reopen") {
          return Response.json({ status: "ok", skipped: true });
        }

        // Fetch MR details and file diffs in parallel
        const [mr, diffs] = await Promise.all([
          getMergeRequest(env, project.id, object_attributes.iid),
          getMergeRequestDiffs(env, project.id, object_attributes.iid),
        ]);

        // Build unified diff text, skipping deleted and auto-generated files
        let diffText = diffs
          .filter((d) => !d.deleted_file && !d.generated_file)
          .map((d) => `### ${d.new_path}\n\`\`\`diff\n${d.diff}\n\`\`\``)
          .join("\n\n");

        if (diffText.length > MAX_DIFF_CHARS) {
          diffText = diffText.slice(0, MAX_DIFF_CHARS) + "\n... (diff truncated)";
        }

        const prompt = buildCodeReviewPrompt(
          mr.title,
          mr.description,
          mr.author.name,
          mr.author.username,
          mr.source_branch,
          mr.target_branch,
          diffText,
        );

        const client = new OpenRouter({ apiKey: env.OPENROUTER_API_KEY });

        const aiResponse = await client.chat.send({
          chatRequest: {
            model: env.MODEL,
            messages: [{ role: "user", content: prompt }],
          },
        });

        const content = aiResponse.choices[0]?.message?.content;
        const reviewText = typeof content === "string" && content.length > 0
          ? content
          : "No review generated.";

        const header = `Code Review: ${mr.title}\nAuthor: ${mr.author.name} | ${mr.source_branch} -> ${mr.target_branch}\n\n`;
        const footer = `\n\nURL: ${mr.web_url}`;
        let message = header + reviewText + footer;

        if (message.length > MAX_TELEGRAM_CHARS) {
          message = message.slice(0, MAX_TELEGRAM_CHARS - 3) + "...";
        }

        await sendMessage(env, message);
        return Response.json({ status: "ok" });
      }

      return Response.json({ error: "unsupported object_kind" }, { status: 422 });
    }

    return Response.json({ message: "not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
