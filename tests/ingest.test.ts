import { describe, it, expect } from "vitest";
import { extractText, ACCEPTED_UPLOAD } from "../src/core/ingest";

describe("document ingestion", () => {
  it("advertises pdf, docx, txt and md", () => {
    for (const ext of [".txt", ".md", ".pdf", ".docx"]) expect(ACCEPTED_UPLOAD).toContain(ext);
  });

  it("extracts text from a plain-text / markdown upload", async () => {
    const f = new File(["# Requirements\nThe system must integrate with SAP."], "notes.md", { type: "text/markdown" });
    const text = await extractText(f);
    expect(text).toContain("integrate with SAP");
  });
});
