import type { Session, Capability, Architecture, Coverage } from "./types";
import type { Estimate } from "./estimate";
import { CLOUDS } from "./cloudMap";

export interface QualityCheck { label: string; ok: boolean; detail: string; }
export interface QualityGate { checks: QualityCheck[]; passed: number; total: number; status: string; unsupported: number; confidence: string; }

/** Pre-export quality gate: coverage, consistency, unsupported recommendations, estimation gaps. */
export function runQualityGate(
  s: Session, caps: Capability[], arch: Architecture | null,
  ai: { cases: any[]; responsible: string[] } | null, cov: Coverage, est: Estimate | null,
): QualityGate {
  const checks: QualityCheck[] = [];
  const hiUncovered = cov.uncovered.filter(r => r.priority === "High");

  checks.push({ label: "High-priority requirement coverage", ok: hiUncovered.length === 0,
    detail: hiUncovered.length ? `${hiUncovered.length} high-priority requirement(s) not covered: ${hiUncovered.map(r => r.id).join(", ")}` : "All high-priority requirements covered." });
  checks.push({ label: "Uncovered requirements", ok: cov.uncovered.length === 0,
    detail: cov.uncovered.length ? `${cov.uncovered.length} uncovered: ${cov.uncovered.map(r => r.id).join(", ")}` : "Every included requirement is referenced downstream." });
  checks.push({ label: "No dangling references", ok: cov.dangling.length === 0,
    detail: cov.dangling.length ? `Outputs reference excluded/removed reqs: ${cov.dangling.join(", ")}` : "No references to excluded requirements." });
  checks.push({ label: "Architecture generated", ok: !!arch,
    detail: arch ? `Cloud: ${CLOUDS[arch.cloud]}, ${arch.components.length} components.` : "Select a cloud and generate the architecture." });
  const compsNoReq = arch ? arch.components.filter(c => c.reqIds.length === 0 && !["obs", "cicd"].includes(c.key)) : [];
  checks.push({ label: "Components justified by requirements", ok: compsNoReq.length === 0,
    detail: compsNoReq.length ? `${compsNoReq.length} component(s) lack a requirement reference.` : "Every functional component references a requirement." });
  const aiOk = !ai || !ai.cases.length || ai.responsible.length >= 3;
  checks.push({ label: "AI use cases have safety/eval/human-review", ok: aiOk,
    detail: ai && ai.cases.length ? "Evaluation, human-review and privacy considerations present." : "No AI use cases in scope." });
  checks.push({ label: "Clarification questions resolved", ok: (s.openQuestions || []).every(q => q.resolved),
    detail: `${(s.openQuestions || []).filter(q => !q.resolved).length} unresolved question(s).` });
  checks.push({ label: "Estimation inputs complete", ok: !!est && !est.blocked,
    detail: est && est.missing.length ? est.missing.join("; ") : "Rate, contingency and scope factors present." });
  checks.push({ label: "Assumptions validated", ok: (s.assumptions || []).every(a => a.status !== "needs-review"),
    detail: `${(s.assumptions || []).filter(a => a.status === "needs-review").length} assumption(s) need human validation.` });

  const passed = checks.filter(c => c.ok).length;
  const status = checks.every(c => c.ok) ? "Ready to export" : (hiUncovered.length || cov.dangling.length) ? "Blocked" : "Review required";
  return { checks, passed, total: checks.length, status, unsupported: cov.dangling.length, confidence: est ? est.confidence : "—" };
}
