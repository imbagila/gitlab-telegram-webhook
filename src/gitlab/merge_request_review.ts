import { OpenRouter } from "@openrouter/sdk";
import { getMergeRequestDiffs } from "./api/diffs.api.ts";
import { getMergeRequest } from "./api/merge_request.api.ts";
import { sendMessage } from "../telegram/send_message.api.ts";
import { escapeHtml, escapeHtmlAttr, markdownToTelegramHtml } from "../telegram/html.ts";

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
4. Verdict: LGTM / REQUEST CHANGES / COMMENT

Use Markdown formatting: **bold** for section titles, \`code\` for identifiers, and bullet lists where helpful.`;
}

function buildReviewMessage(
  title: string,
  authorName: string,
  sourceBranch: string,
  targetBranch: string,
  webUrl: string,
  reviewText: string,
): string {
  const header =
    `<b>Code Review:</b> ${escapeHtml(title)}\n` +
    `<b>Author:</b> ${escapeHtml(authorName)} | ${escapeHtml(sourceBranch)} -&gt; ${escapeHtml(targetBranch)}\n\n`;
  const footer =
    `\n\n<b>URL:</b> <a href="${escapeHtmlAttr(webUrl)}">${escapeHtml(webUrl)}</a>`;

  const htmlOverhead = header.length + footer.length + 200;
  const maxReviewChars = MAX_TELEGRAM_CHARS - htmlOverhead;
  let review = reviewText;
  if (review.length > maxReviewChars) {
    review = review.slice(0, maxReviewChars - 3) + "...";
  }

  return header + markdownToTelegramHtml(review) + footer;
}

export async function processMergeRequestReview(
  env: Env,
  projectId: number,
  mrIid: number,
): Promise<void> {
  const [mr, diffs] = await Promise.all([
    getMergeRequest(env, projectId, mrIid),
    getMergeRequestDiffs(env, projectId, mrIid),
  ]);

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
  const reviewText =
    typeof content === "string" && content.length > 0 ? content : "No review generated.";

  const message = buildReviewMessage(
    mr.title,
    mr.author.name,
    mr.source_branch,
    mr.target_branch,
    mr.web_url,
    reviewText,
  );

  await sendMessage(env, message, "HTML");
}
