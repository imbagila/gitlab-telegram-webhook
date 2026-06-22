const BLOCK_PLACEHOLDER = "\uE000BLOCK";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

export function markdownToTelegramHtml(markdown: string): string {
  const blocks: string[] = [];

  let text = markdown.replace(/```[\s\S]*?```/g, (block) => {
    const code = block.slice(3, -3).replace(/^\w*\n/, "");
    const index = blocks.length;
    blocks.push(`<pre>${escapeHtml(code.trimEnd())}</pre>`);
    return `${BLOCK_PLACEHOLDER}${index}\uE001`;
  });

  text = text.replace(/`([^`\n]+)`/g, (_, code: string) => {
    const index = blocks.length;
    blocks.push(`<code>${escapeHtml(code)}</code>`);
    return `${BLOCK_PLACEHOLDER}${index}\uE001`;
  });

  text = escapeHtml(text);

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    return `<a href="${escapeHtmlAttr(url)}">${label}</a>`;
  });

  text = text.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
  text = text.replace(/__([^_\n]+)__/g, "<b>$1</b>");
  text = text.replace(/\*([^*\n]+)\*/g, "<i>$1</i>");
  text = text.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, "<i>$1</i>");

  return text.replace(new RegExp(`${BLOCK_PLACEHOLDER}(\\d+)\uE001`, "g"), (_, index: string) => {
    return blocks[Number(index)] ?? "";
  });
}
