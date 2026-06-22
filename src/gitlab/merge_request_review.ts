import { OpenRouter } from "@openrouter/sdk";
import { getMergeRequestDiffs } from "./api/diffs.api.ts";
import { getMergeRequest } from "./api/merge_request.api.ts";
import { createMergeRequestNote } from "./api/notes.api.ts";

const MAX_DIFF_CHARS = 8000;

function buildCodeReviewPrompt(
  title: string,
  description: string,
  authorName: string,
  authorUsername: string,
  sourceBranch: string,
  targetBranch: string,
  diffText: string,
): string {
  return `Kamu adalah senior Go engineer & security reviewer. Lakukan code review HANYA berdasarkan perubahan pada MR/PR ini (diff + file yang berubah). Jangan bahas kode yang tidak berubah kecuali benar-benar diperlukan untuk memahami dampak perubahan.

Merge Request: ${title}
Author: ${authorName} (@${authorUsername})
Branch: ${sourceBranch} → ${targetBranch}
Description: ${description || "(none)"}

Changes:
${diffText}

Output wajib pakai format berikut:
1) Ringkasan perubahan (max 5 bullet)
2) Temuan Critical / High / Medium / Low (pisahkan per severity)
   - Setiap temuan harus punya: lokasi file+fungsi (atau potongan diff yang relevan), risiko/impact, dan saran perbaikan konkret.
3) Checklist lulus/tidak untuk kategori: Security (OWASP), DB Query (MongoDB/MySQL), Testing & Coverage, Reliability, Performance, Maintainability, Observability, Compatibility/Migration.
4) Rekomendasi action items (prioritas 1-5)

Fokus review:

A. Security (mapping ke OWASP Top 10):
- Validasi input, sanitasi, boundary checks, dan penanganan error: hindari information leakage.
- AuthN/AuthZ: pastikan akses data sesuai role/tenant, tidak ada IDOR, tidak ada privilege escalation.
- Data exposure: pastikan tidak log PII/secret; encryption at rest/in transit bila relevan.
- Injection: SQL injection, NoSQL injection (Mongo), command injection, path traversal.
- SSRF, deserialization, insecure direct object reference, dan misconfiguration.
- Secret management: tidak ada hardcoded secret/token/credential.
- Dependency risk: penggunaan package baru (jika ada) cek risiko umum dan update minimal versi yang aman.

B. Query Optimization:
MySQL:
- Pastikan query gunakan index (hindari full table scan), cek kondisi WHERE/JOIN/ORDER BY/GROUP BY.
- Hindari N+1 query, gunakan batching/IN, atau join yang tepat.
- Pastikan limit/pagination untuk query yang berpotensi besar.
- Transaksi: konsistensi dan locking; hindari transaksi terlalu panjang.

MongoDB:
- Hindari query tanpa filter pada collection besar.
- Pastikan ada index pada filter/sort; hindari sort tanpa index.
- Pastikan pagination benar (prefer cursor-based untuk data besar).
- Waspada regex leading wildcard, $where, atau operator yang rawan injection.
- Proyeksi field: ambil field yang perlu saja.

C. Testing & Coverage:
- Apakah ada test baru untuk perubahan ini? (unit test minimal untuk logic penting)
- Cek kualitas test: table-driven, edge cases, error paths, race condition.
- Sarankan area yang wajib ditest jika belum ada.
- Jika ada perubahan contract/API/DB, minta test integrasi atau minimal mock yang kuat.

Tambahan kebutuhan review:
D. Reliability & Concurrency (Go-specific):
- Context propagation, timeout, cancellation, tidak ada goroutine leak.
- Penanganan error: wrapping (fmt.Errorf("%w")), sentinel errors, consistent error message.
- Resource management: defer close, connection pooling, leak (rows.Close, resp.Body.Close).
- Data race: akses shared state, penggunaan mutex/atomic/channel yang benar.

E. Performance:
- Allocations, penggunaan pointer/value, slicing/copy, streaming vs load-all.
- Logging berlebihan di hot path.
- Caching bila relevan.

F. Maintainability & Style:
- Struktur package, naming, SOLID secukupnya, pemisahan concern.
- Hindari duplicate logic, buat helper bila perlu.
- Kualitas komentar & doc.

G. Observability:
- Logging terstruktur, correlation id/trace id, metrics untuk error/latency.
- Jangan log secret/PII.

H. Backward compatibility & migration:
- Perubahan schema/kontrak API harus ada migration plan dan roll-forward/rollback.
- Kompatibilitas config/env.

Berikan juga "Questions to ask author" kalau ada asumsi yang tidak jelas.

Use Markdown formatting: **bold** for section titles, \`code\` for identifiers, and bullet lists where helpful.`;
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

  await createMergeRequestNote(
    env,
    projectId,
    mrIid,
    `## Automated Code Review\n\n${reviewText}`,
  );
}
