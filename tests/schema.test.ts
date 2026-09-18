import { describe, it, expect } from "vitest";
import { validateRequirement, validateAnalysis } from "../src/core/schema";
import { SCENARIOS } from "../src/core/scenarios";
import { heuristicAnalyze } from "../src/core/analyze";

describe("structured AI-output validation", () => {
  it("accepts a well-formed requirement", () => {
    expect(validateRequirement({ id: "FR_01", type: "Functional", priority: "High", classification: "customer-stated", description: "Valid requirement", sourceText: "src", dependencies: [] })).toHaveLength(0);
  });
  it("rejects a bad id and missing sourceText (traceability)", () => {
    const issues = validateRequirement({ id: "REQ1", type: "Functional", priority: "High", classification: "customer-stated", description: "x", sourceText: "", dependencies: [] });
    expect(issues.some(i => /invalid id/.test(i.message))).toBe(true);
    expect(issues.some(i => /sourceText/.test(i.message))).toBe(true);
  });
  it("flags duplicate ids", () => {
    const r = { id: "FR_01", type: "Functional", priority: "High", classification: "customer-stated", description: "x", sourceText: "s", dependencies: [] };
    const res = validateAnalysis({ requirements: [r, { ...r }] });
    expect(res.ok).toBe(false);
    expect(res.issues.some(i => /duplicate/.test(i.message))).toBe(true);
  });
  it("every seeded scenario passes validation", () => {
    for (const sc of SCENARIOS) expect(validateAnalysis(sc).ok).toBe(true);
  });
  it("heuristic extraction of pasted text is schema-valid", () => {
    const r = heuristicAnalyze("The system must integrate with SAP. Data must be stored securely and comply with GDPR. Users need a fast dashboard.");
    expect(validateAnalysis(r).ok).toBe(true);
    expect(r.requirements.every(x => x.sourceText.length > 0)).toBe(true);
  });
});
