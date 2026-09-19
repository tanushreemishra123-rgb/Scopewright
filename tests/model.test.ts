import { describe, it, expect } from "vitest";
import { SCENARIOS } from "../src/core/scenarios";
import { buildCapabilities, buildArchitecture, buildAI } from "../src/core/generators";
import { computeCoverage, computeEstimate, DEFAULT_EST } from "../src/core/estimate";
import { computeChangeImpact } from "../src/core/changeImpact";
import { runQualityGate } from "../src/core/quality";
import { assemblePackage } from "../src/core/packageModel";
import { buildMarkdown } from "../src/export/markdown";
import type { Session } from "../src/core/types";

const orion = () => JSON.parse(JSON.stringify(SCENARIOS[0])) as Session;

describe("coverage & traceability", () => {
  it("references trace back to real requirements; no dangling on a clean model", () => {
    const s = { ...orion(), context: { ...orion().context, cloud: "azure" } };
    const caps = buildCapabilities(s), arch = buildArchitecture(s, "azure"), ai = buildAI(s);
    const cov = computeCoverage(s, caps, arch, ai);
    expect(cov.dangling).toHaveLength(0);
    expect(cov.pct).toBeGreaterThan(0);
    expect(cov.covered + cov.uncovered.length).toBe(cov.total);
  });

  it("excluding a referenced requirement is detected as a dangling/unsupported reference", () => {
    const s = orion();
    const caps = buildCapabilities(s); // capabilities computed BEFORE exclusion still cite FR_01
    const excluded = { ...s, requirements: s.requirements.map(r => r.id === "FR_01" ? { ...r, included: false } : r) };
    const arch = buildArchitecture(excluded, "aws"), ai = buildAI(excluded);
    const cov = computeCoverage(excluded, caps, arch, ai);
    expect(cov.dangling).toContain("FR_01");
  });
});

describe("change-impact analysis", () => {
  it("switching cloud affects architecture but preserves scope and effort", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "cloud");
    expect(r.cloud).toBe("azure");
    expect(r.impact.affected.join(" ")).toMatch(/architecture/i);
    expect(r.impact.unaffected.join(" ")).toMatch(/scope|Effort/i);
  });
  it("contingency change affects ROM only", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "contingency");
    expect(r.cfg.contingency).toBe(30);
    expect(r.impact.affected.join(" ")).toMatch(/ROM/);
  });
  it("dropping a low-priority requirement removes it from scope", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "scope");
    const dropped = r.session.requirements.find(x => x.included === false);
    expect(dropped).toBeTruthy();
    expect(dropped!.priority).toBe("Low");
  });
  it("does not mutate the original session (immutability)", () => {
    const original = orion();
    const before = JSON.stringify(original);
    computeChangeImpact(original, DEFAULT_EST, "aws", "scope");
    expect(JSON.stringify(original)).toBe(before);
  });
});

describe("quality gate & consistency", () => {
  it("flags dangling references and unresolved questions", () => {
    const s = orion();
    const caps = buildCapabilities(s);
    const excluded = { ...s, requirements: s.requirements.map(r => r.id === "FR_01" ? { ...r, included: false } : r) };
    const arch = buildArchitecture(excluded, "aws"), ai = buildAI(excluded);
    const cov = computeCoverage(excluded, caps, arch, ai);
    const est = computeEstimate({ ...excluded, context: { ...excluded.context, cloud: "aws" } }, caps, DEFAULT_EST);
    const gate = runQualityGate(excluded, caps, arch, ai, cov, est);
    expect(gate.checks.find(c => c.label === "No dangling references")!.ok).toBe(false);
    expect(gate.checks.find(c => c.label === "Clarification questions resolved")!.ok).toBe(false);
    expect(gate.status).not.toBe("Ready to export");
  });

  it("a fully resolved model reaches export readiness", () => {
    const base = orion();
    const s: Session = {
      ...base,
      openQuestions: base.openQuestions.map(q => ({ ...q, resolved: true, answer: "confirmed" })),
      assumptions: base.assumptions.map(a => ({ ...a, status: "confirmed" as const })),
      requirements: base.requirements.filter(r => r.id !== "FR_04"), // drop the 'assumed/uncovered' one
    };
    const pkg = assemblePackage(s, "azure", DEFAULT_EST);
    expect(pkg.gate.status).toBe("Ready to export");
  });
});

describe("integrated package + export", () => {
  it("markdown export includes disclaimer, requirement IDs and ROM", () => {
    const pkg = assemblePackage(orion(), "aws", DEFAULT_EST);
    const md = buildMarkdown(pkg);
    expect(md).toContain("not a final quote");
    expect(md).toMatch(/FR_01/);
    expect(md).toMatch(/ROM =/);
    expect(md).toContain("Grounding & sources");
    expect(md).toMatch(/customer-stated/);
  });
});

describe("architecture components (Section 3)", () => {
  it("cover storage and backup/DR when data is in scope, each cloud-specific", () => {
    const arch = buildArchitecture({ ...orion(), context: { ...orion().context, cloud: "azure" } }, "azure");
    const keys = arch.components.map(c => c.key);
    expect(keys).toContain("storage");
    expect(keys).toContain("backup");
    // cloud-specific service strings (Azure), not generic
    expect(arch.components.find(c => c.key === "storage")!.service).toMatch(/Azure/);
    expect(arch.components.find(c => c.key === "backup")!.service).toMatch(/Azure/);
  });
  it("every component carries purpose, security and a dependencies array", () => {
    const arch = buildArchitecture({ ...orion(), context: { ...orion().context, cloud: "aws" } }, "aws");
    for (const c of arch.components) {
      expect(c.purpose.length).toBeGreaterThan(0);
      expect(c.sec.length).toBeGreaterThan(0);
      expect(typeof c.service).toBe("string");
      expect(c.service.length).toBeGreaterThan(0);
      expect(Array.isArray(c.deps)).toBe(true);
    }
    // dependencies reference other components by name, never the component itself
    for (const c of arch.components) expect(c.deps).not.toContain(c.name);
    expect(arch.components.some(c => c.deps.length > 0)).toBe(true);
  });
});

describe("change-impact — extended types & quality summary (Section 6)", () => {
  it("user-volume change references real scalability requirement IDs", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "users");
    // affected list should contain at least one NFR id from the model
    expect(r.impact.affected.join(" ")).toMatch(/NFR_\d\d/);
    // scalability reqs raised to High in the returned (new) model
    expect(r.session.requirements.some(x => x.type === "Non-functional" && x.priority === "High")).toBe(true);
  });
  it("rate change affects commercials only, never effort", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "rate");
    expect(r.cfg.blendedRate).toBeGreaterThan(DEFAULT_EST.blendedRate);
    expect(r.impact.affected.join(" ")).toMatch(/ROM|cost/i);
    expect(r.impact.unaffected.join(" ")).toMatch(/person-weeks/i);
  });
  it("deadline change grows the team but not the effort or ROM", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "deadline");
    expect(r.cfg.teamSize).toBeGreaterThan(DEFAULT_EST.teamSize);
    expect(r.impact.unaffected.join(" ")).toMatch(/ROM|person-weeks/i);
  });
  it("security and integration changes escalate a real requirement", () => {
    const sec = computeChangeImpact(orion(), DEFAULT_EST, "aws", "security");
    expect(sec.session.requirements.some(x => x.type === "Security" && x.priority === "High")).toBe(true);
    const intg = computeChangeImpact(orion(), DEFAULT_EST, "aws", "integration");
    expect(intg.session.requirements.some(x => x.type === "Integration" && x.priority === "High")).toBe(true);
  });
  it("all extended changes leave the original session untouched", () => {
    const original = orion(); const before = JSON.stringify(original);
    for (const t of ["users", "security", "integration", "rate", "deadline", "priority"])
      computeChangeImpact(original, DEFAULT_EST, "aws", t);
    expect(JSON.stringify(original)).toBe(before);
  });
  it("quality gate exposes an at-a-glance summary", () => {
    const pkg = assemblePackage(orion(), "aws", DEFAULT_EST);
    const su = pkg.gate.summary;
    for (const k of ["coveragePct", "uncovered", "unresolved", "unsupported", "confidence", "status"]) expect(su).toHaveProperty(k);
    expect(typeof su.coveragePct).toBe("number");
  });
});
