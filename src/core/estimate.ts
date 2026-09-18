import type { Session, Capability, Architecture, Coverage, EstimateConfig } from "./types";
import { includedReqs, buildRisks } from "./generators";

// Role weekly rates (day rate × 5) — mirrors seed/rate-card.json.
export const ROLE_RATES: Record<string, number> = {
  "Solution Architect": 5750, "Tech Lead": 5000, "Senior Engineer": 4250, "Engineer": 3250,
  "Data Engineer": 4000, "AI/ML Engineer": 4750, "QA Engineer": 3000, "Delivery Manager": 4500, "Business Analyst": 3500,
};
// Role mix per workstream category (fractions of that category's effort).
const ROLE_MIX: Record<string, Record<string, number>> = {
  capability:  { "Delivery Manager": 0.08, "Tech Lead": 0.15, "Senior Engineer": 0.32, "Engineer": 0.32, "Business Analyst": 0.13 },
  integration: { "Delivery Manager": 0.08, "Tech Lead": 0.15, "Data Engineer": 0.33, "Senior Engineer": 0.32, "Engineer": 0.12 },
  ai:          { "Solution Architect": 0.10, "AI/ML Engineer": 0.45, "Senior Engineer": 0.28, "Tech Lead": 0.17 },
  security:    { "Solution Architect": 0.40, "Senior Engineer": 0.60 },
  testing:     { "QA Engineer": 0.70, "Engineer": 0.30 },
  other:       { "Data Engineer": 0.50, "Engineer": 0.50 },
};
const PHASE_WEIGHTS = [0.10, 0.28, 0.22, 0.18, 0.14, 0.08];

/** Coverage: which included requirements are referenced by downstream outputs. */
export function computeCoverage(s: Session, caps: Capability[], arch: Architecture | null, ai: { reqs: string[] } | null): Coverage {
  const inc = includedReqs(s);
  const referenced = new Set<string>();
  caps.forEach(c => c.reqs.forEach(id => referenced.add(id)));
  if (arch) arch.components.forEach(c => c.reqIds.forEach(id => referenced.add(id)));
  if (ai) ai.reqs.forEach(id => referenced.add(id));
  const incIds = new Set(inc.map(r => r.id));
  const covered = inc.filter(r => referenced.has(r.id));
  const uncovered = inc.filter(r => !referenced.has(r.id));
  const dangling = [...referenced].filter(id => !incIds.has(id)); // referenced but excluded/removed
  return { total: inc.length, covered: covered.length, uncovered, dangling, pct: inc.length ? Math.round(covered.length / inc.length * 100) : 0 };
}

export const DEFAULT_EST: EstimateConfig = {
  blendedRate: 4200, currency: "EUR", contingency: 20, teamSize: 6, weeklyHours: 38, environments: 3, dataMigration: false,
};
export const EFFORT = {
  capability: { Low: 3, Medium: 6, High: 10 } as Record<string, number>,
  integration: { Low: 2, Medium: 4, High: 6 } as Record<string, number>,
  ai: { Low: 4, Medium: 6, High: 10 } as Record<string, number>,
};
export const PHASES = [
  "Discovery & Architecture", "Experience & Core Platform", "Data & Integration",
  "AI Capabilities", "Testing & Hardening", "Deployment & Handover",
];

export interface EstimateRow { label: string; complexity: string; weeks: number; driver: string; reqs: string[]; }
export interface RoleLine { role: string; weeks: number; weeklyRate: number; cost: number; }
export interface Milestone { phase: string; endWeek: number; }
export interface Estimate {
  rows: EstimateRow[]; base: number; securityUplift: number; testingUplift: number; envUplift: number; migrationUplift: number;
  subtotal: number; contingency: number; totalWeeks: number; weeksLow: number; weeksHigh: number;
  cost: number; costLow: number; costHigh: number;
  confidence: "High" | "Medium" | "Low"; band: number; reasons: string[]; missing: string[]; blocked: boolean;
  durationWeeks: number; cfg: EstimateConfig;
  roles: RoleLine[]; roleCostTotal: number; milestones: Milestone[]; deliveryRisks: any[];
}

/**
 * Reproducible estimate. Every number is derived from visible scope factors and
 * configurable commercial inputs — never accepted as a free-text model output.
 */
export function computeEstimate(s: Session, caps: Capability[], cfg: EstimateConfig): Estimate {
  const rows: EstimateRow[] = [];
  let base = 0;
  caps.forEach(c => {
    const e = EFFORT.capability[c.complexity]; base += e;
    rows.push({ label: `Capability — ${c.name}`, complexity: c.complexity, weeks: e, driver: `${c.reqs.length} requirement(s)`, reqs: c.reqs });
  });
  const ints = includedReqs(s).filter(r => r.type === "Integration");
  ints.forEach(r => {
    const cx = r.priority === "High" ? "High" : "Medium";
    const e = EFFORT.integration[cx]; base += e;
    rows.push({ label: `Integration — ${r.description.slice(0, 40)}`, complexity: cx, weeks: e, driver: "1 external system", reqs: [r.id] });
  });
  (s.aiUseCases || []).forEach(u => {
    const e = EFFORT.ai.High; base += e;
    rows.push({ label: `AI use case — ${u.title}`, complexity: "High", weeks: e, driver: u.pattern, reqs: u.reqs });
  });

  const secReqs = includedReqs(s).filter(r => r.type === "Security").length;
  const securityUplift = secReqs >= 2 ? Math.round(base * 0.10) : 0;
  const testingUplift = Math.round(base * 0.15);
  const envUplift = Math.max(0, cfg.environments - 1) * 2;
  const migrationUplift = cfg.dataMigration ? 8 : 0;
  const subtotal = base + securityUplift + testingUplift + envUplift + migrationUplift;
  const contingency = Math.round(subtotal * cfg.contingency / 100);
  const totalWeeks = subtotal + contingency;
  const cost = totalWeeks * cfg.blendedRate;

  const openUnresolved = (s.openQuestions || []).filter(q => !q.resolved).length;
  const needsReview = (s.assumptions || []).filter(a => a.status === "needs-review").length;
  let confidence: Estimate["confidence"] = "High", band = 0.12; const reasons: string[] = [];
  if (openUnresolved > 0) { confidence = "Medium"; band = 0.20; reasons.push(`${openUnresolved} unresolved clarification question(s)`); }
  if (openUnresolved >= 3 || needsReview >= 3) { confidence = "Low"; band = 0.30; reasons.push(`${needsReview} assumption(s) need review`); }

  const missing: string[] = [];
  if (!s.context || !s.context.cloud) missing.push("Cloud platform not selected");
  if (!cfg.blendedRate) missing.push("Blended rate not configured");
  const blocked = missing.length > 0;

  const parallel = Math.min(cfg.teamSize, 4);
  const durationWeeks = Math.ceil(totalWeeks / parallel);

  // ---- effort range (from confidence band) ----
  const weeksLow = Math.round(totalWeeks * (1 - band / 2));
  const weeksHigh = Math.round(totalWeeks * (1 + band / 2));

  // ---- role / skill breakdown: allocate the SAME effort by role mix, then fold contingency ----
  const capWeeks = rows.filter(r => r.label.startsWith("Capability")).reduce((a, r) => a + r.weeks, 0);
  const intWeeks = rows.filter(r => r.label.startsWith("Integration")).reduce((a, r) => a + r.weeks, 0);
  const aiWeeks = rows.filter(r => r.label.startsWith("AI use case")).reduce((a, r) => a + r.weeks, 0);
  const buckets: Array<[string, number]> = [
    ["capability", capWeeks], ["integration", intWeeks], ["ai", aiWeeks],
    ["security", securityUplift], ["testing", testingUplift], ["other", envUplift + migrationUplift],
  ];
  const roleWeeks: Record<string, number> = {};
  const scale = subtotal > 0 ? totalWeeks / subtotal : 1; // fold contingency proportionally
  for (const [cat, w] of buckets) {
    if (!w) continue;
    for (const [role, frac] of Object.entries(ROLE_MIX[cat])) roleWeeks[role] = (roleWeeks[role] || 0) + w * frac * scale;
  }
  const roles: RoleLine[] = Object.entries(roleWeeks)
    .map(([role, w]) => ({ role, weeks: Math.round(w * 10) / 10, weeklyRate: ROLE_RATES[role], cost: Math.round(w * ROLE_RATES[role]) }))
    .filter(r => r.weeks > 0).sort((a, b) => b.weeks - a.weeks);
  const roleCostTotal = roles.reduce((a, r) => a + r.cost, 0);

  // ---- milestones (cumulative elapsed weeks per phase) ----
  let acc = 0;
  const milestones: Milestone[] = PHASES.map((phase, i) => { acc += durationWeeks * PHASE_WEIGHTS[i]; return { phase, endWeek: Math.max(1, Math.round(acc)) }; });

  const deliveryRisks = buildRisks(s);

  return {
    rows, base, securityUplift, testingUplift, envUplift, migrationUplift, subtotal, contingency, totalWeeks, weeksLow, weeksHigh,
    cost, costLow: Math.round(cost * (1 - band)), costHigh: Math.round(cost * (1 + band)),
    confidence, band, reasons, missing, blocked, durationWeeks, cfg,
    roles, roleCostTotal, milestones, deliveryRisks,
  };
}
