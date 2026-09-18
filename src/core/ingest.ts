// Document ingestion (Requirement 1): extract plain text from an uploaded
// requirements file so it can feed the same analyzer as pasted text.
// Supports .txt / .md (read directly), .pdf (pdfjs-dist) and .docx (mammoth).
// pdf/docx libraries are dynamically imported so they load only when needed.

export const ACCEPTED_UPLOAD = ".txt,.md,.pdf,.docx";

/** Extract readable text from an uploaded file. Throws if the format is unreadable. */
export async function extractText(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  // .txt, .md and any other text-readable upload
  return (await file.text()).trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Worker is bundled by Vite via the ?url suffix (works in dev and build).
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url" as any)).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => (typeof it.str === "string" ? it.str : "")).join(" "));
  }
  return pages.join("\n").replace(/[ \t]+\n/g, "\n").trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth: any = (await import("mammoth/mammoth.browser" as any)).default
    ?? (await import("mammoth/mammoth.browser" as any));
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return String(result.value || "").trim();
}
