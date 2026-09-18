import type { ScopingPackage } from "../core/packageModel";
import { buildMarkdown } from "./markdown";
import { buildDocxBlob } from "./docx";

export { buildMarkdown, buildDocxBlob };

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
const slug = (pkg: ScopingPackage) => pkg.session.context.customer.replace(/\W+/g, "-").toLowerCase();

export function exportMarkdown(pkg: ScopingPackage) {
  download(new Blob([buildMarkdown(pkg)], { type: "text/markdown" }), `scoping-package-${slug(pkg)}.md`);
}
export async function exportDocx(pkg: ScopingPackage) {
  download(await buildDocxBlob(pkg), `scoping-package-${slug(pkg)}.docx`);
}

/** Open a print-ready window; the browser's "Save as PDF" produces the PDF. */
export function exportPdfViaPrint(pkg: ScopingPackage) {
  const md = buildMarkdown(pkg);
  const esc = md.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc.slice(0, 60)}</title>
    <style>body{font:13px/1.6 ui-monospace,monospace;max-width:820px;margin:32px auto;padding:0 20px;color:#111}
    @media print{body{margin:0}}</style></head>
    <body><pre style="white-space:pre-wrap">${esc}</pre>
    <script>window.onload=function(){setTimeout(function(){window.print();},300);};</` + `script></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
