import type { Session, Capability, Architecture, Coverage } from "./types";
import type { Estimate } from "./estimate";
import { CLOUDS } from "./cloudMap";
import { TUNING } from "./tuning";

export interface QualityCheck { label: string; ok: boolean; detail: string; }
export interface QualitySummary { coveragePct: number; uncovered: number; unresolved: number; unsupported: number; confidence: string; status: string; }
export interface QualityGate { checks: QualityCheck[]; passed: number; total: number; status: string; unsupported: number; confidence: string; summary: QualitySummary; }

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
  const compsNoReq = arch ? arch.components.filter(c => c.reqIds.length === 0 && !TUNING.quality.unjustifiedComponentExemptKeys.includes(c.key)) : [];
  checks.push({ label: "Components justified by requirements", ok: compsNoReq.length === 0,
    detail: compsNoReq.length ? `${compsNoReq.length} component(s) lack a requirement reference.` : "Every functional component references a requirement." });
  const aiOk = !ai || !ai.cases.length || ai.responsible.length >= TUNING.quality.minResponsibleAiConsiderations;
  checks.push({ label: "AI use cases have safety/eval/human-review", ok: aiOk,
    detail: ai && ai.cases.length ? "Evaluation, human-review and privacy considerations present." : "No AI use cases in scope." });
  checks.push({ label: "Clarification questions resolved", ok: (s.openQuestions || []).every(q => q.resolved),
    detail: `${(s.openQuestions || []).filter(q => !q.resolved).length} unresolved question(s).` });
  checks.push({ label: "Estimation inputs complete", ok: !!est && !est.blocked,
    detail: est && est.missing.length ? est.missing.join("; ") : "Rate, contingency and scope factors present." });
  checks.push({ label: "Assumptions validated", ok: (s.assumptions || []).every(a => a.status !== "needs-review"),
    detail: `${(s.assumptions || []).filter(a => a.status === "needs-review").length} assumption(s) need human validation.` });

  // Integrations present in the delivery plan (estimate rows)
  const inc = s.requirements.filter(r => r.included !== false);
  const intIds = inc.filter(r => r.type === "Integration").map(r => r.id);
  const plannedReqIds = new Set((est?.rows || []).flatMap(r => r.reqs));
  const missingInts = intIds.filter(id => !plannedReqIds.has(id));
  checks.push({ label: "Integrations in the delivery plan", ok: missingInts.length === 0,
    detail: missingInts.length ? `Not costed in the estimate: ${missingInts.join(", ")}` : (intIds.length ? "All integrations appear as estimate workstreams." : "No integrations in scope.") });

  // No conflicting cloud selection vs. requirement text
  const selected = arch ? arch.cloud : (s.context && s.context.cloud) || "";
  const others = ({ aws: ["azure", "gcp", "google cloud"], azure: ["aws", "amazon web", "gcp", "google cloud"], gcp: ["aws", "amazon web", "azure"] } as any)[selected] || [];
  const blob = inc.map(r => r.description + " " + r.sourceText).join(" ").toLowerCase();
  const conflicts = others.filter((k: string) => blob.includes(k));
  checks.push({ label: "No conflicting cloud / technology", ok: !selected || conflicts.length === 0,
    detail: !selected ? "No cloud selected yet." : conflicts.length ? `Requirements mention ${conflicts.join(", ")} but ${selected.toUpperCase()} is selected.` : `Selection (${selected.toUpperCase()}) is consistent with requirements.` });

  // Estimate / commercial internal consistency
  const consistent = !!est && est.totalWeeks === est.subtotal + est.contingency && est.cost === est.totalWeeks * est.cfg.blendedRate && !est.blocked;
  checks.push({ label: "Estimate & commercials reconcile", ok: consistent,
    detail: est ? (est.blocked ? "Blocked by missing estimation inputs." : "totalWeeks = subtotal + contingency; ROM = weeks × rate.") : "No estimate yet." });

  const passed = checks.filter(c => c.ok).length;
  const status = checks.every(c => c.ok) ? "Ready to export" : (hiUncovered.length || cov.dangling.length) ? "Blocked" : "Review required";
  const summary: QualitySummary = {
    coveragePct: cov.pct,
    uncovered: cov.uncovered.length,
    unresolved: (s.openQuestions || []).filter(q => !q.resolved).length,
    unsupported: cov.dangling.length,
    confidence: est ? est.confidence : "—",
    status,
  };
  return { checks, passed, total: checks.length, status, unsupported: cov.dangling.length, confidence: est ? est.confidence : "—", summary };
}
