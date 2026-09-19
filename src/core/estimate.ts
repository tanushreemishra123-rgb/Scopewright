import type { Session, Capability, Architecture, Coverage, EstimateConfig } from "./types";
import { includedReqs, buildRisks } from "./generators";
import { TUNING } from "./tuning";

// All tuning values are sourced from the single documented TUNING table (see tuning.ts);
// these named aliases keep the calculation code readable while avoiding magic numbers.
export const ROLE_RATES = TUNING.roleRates;
const ROLE_MIX = TUNING.roleMix;
const PHASE_WEIGHTS = TUNING.delivery.phaseWeights;

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
  productivity: 1.0, cloudComplexity: "Medium",
};
const CLOUD_COMPLEXITY_PCT = TUNING.uplift.cloudComplexityPct;

// Currency-aware grouping: pick the locale for the selected currency rather than the
// machine's default (which would render every currency with the same grouping).
const CURRENCY_LOCALE = TUNING.currencyLocale;
export function formatMoney(n: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] || "en-US";
  return `${currency} ${Math.round(n).toLocaleString(locale)}`;
}
export const EFFORT = TUNING.effort;
export const PHASES = [
  "Discovery & Architecture", "Experience & Core Platform", "Data & Integration",
  "AI Capabilities", "Testing & Hardening", "Deployment & Handover",
];

export interface EstimateRow { label: string; complexity: string; weeks: number; weeksLow: number; weeksHigh: number; driver: string; reqs: string[]; }
export interface RoleLine { role: string; weeks: number; weeklyRate: number; cost: number; }
export interface Milestone { phase: string; endWeek: number; }
export interface Estimate {
  rows: EstimateRow[]; base: number; securityUplift: number; testingUplift: number; envUplift: number; migrationUplift: number;
  productivityUplift: number; cloudUplift: number;
  subtotal: number; contingency: number; totalWeeks: number; weeksLow: number; weeksHigh: number;
  cost: number; costLow: number; costHigh: number;
  confidence: "High" | "Medium" | "Low"; band: number; reasons: string[]; limitation: string; missing: string[]; blocked: boolean;
  durationWeeks: number; durationLow: number; durationHigh: number; cfg: EstimateConfig;
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
  const securityUplift = secReqs >= TUNING.uplift.securityReqThreshold ? Math.round(base * TUNING.uplift.securityPct) : 0;
  const testingUplift = Math.round(base * TUNING.uplift.testingPct);
  const envUplift = Math.max(0, cfg.environments - 1) * TUNING.uplift.envPerExtraEnv;
  const migrationUplift = cfg.dataMigration ? TUNING.uplift.dataMigration : 0;
  const productivityUplift = Math.round(base * (cfg.productivity - 1));           // productivity factor
  const cloudUplift = Math.round(base * (CLOUD_COMPLEXITY_PCT[cfg.cloudComplexity] || 0)); // cloud infra complexity
  const subtotal = base + securityUplift + testingUplift + envUplift + migrationUplift + productivityUplift + cloudUplift;
  const contingency = Math.round(subtotal * cfg.contingency / 100);
  const totalWeeks = subtotal + contingency;
  const cost = totalWeeks * cfg.blendedRate;

  const openUnresolved = (s.openQuestions || []).filter(q => !q.resolved).length;
  const needsReview = (s.assumptions || []).filter(a => a.status === "needs-review").length;
  let confidence: Estimate["confidence"] = "High", band = TUNING.confidence.band.High; const reasons: string[] = [];
  if (openUnresolved >= TUNING.confidence.mediumWhenOpenQuestions) { confidence = "Medium"; band = TUNING.confidence.band.Medium; reasons.push(`${openUnresolved} unresolved clarification question(s)`); }
  if (openUnresolved >= TUNING.confidence.lowWhenOpenQuestions || needsReview >= TUNING.confidence.lowWhenAssumptionsNeedReview) { confidence = "Low"; band = TUNING.confidence.band.Low; reasons.push(`${needsReview} assumption(s) need review`); }

  const missing: string[] = [];
  if (!s.context || !s.context.cloud) missing.push("Cloud platform not selected");
  if (!cfg.blendedRate) missing.push("Blended rate not configured");
  if (missing.length) reasons.push(...missing);
  const blocked = missing.length > 0;
  const limitation = reasons.length ? reasons.join("; ") : "No major limitations noted; inputs complete.";

  const parallel = Math.min(cfg.teamSize, TUNING.delivery.maxParallelWorkstreams);
  const durationWeeks = Math.ceil(totalWeeks / parallel);

  // ---- effort range (from confidence band): total + per workstream row ----
  const weeksLow = Math.round(totalWeeks * (1 - band / 2));
  const weeksHigh = Math.round(totalWeeks * (1 + band / 2));
  rows.forEach(r => { r.weeksLow = Math.max(1, Math.round(r.weeks * (1 - band / 2))); r.weeksHigh = Math.round(r.weeks * (1 + band / 2)); });
  // ---- timeline range ----
  const durationLow = Math.ceil(weeksLow / parallel);
  const durationHigh = Math.ceil(weeksHigh / parallel);

  // ---- role / skill breakdown: allocate the SAME effort by role mix, then fold contingency ----
  const capWeeks = rows.filter(r => r.label.startsWith("Capability")).reduce((a, r) => a + r.weeks, 0);
  const intWeeks = rows.filter(r => r.label.startsWith("Integration")).reduce((a, r) => a + r.weeks, 0);
  const aiWeeks = rows.filter(r => r.label.startsWith("AI use case")).reduce((a, r) => a + r.weeks, 0);
  const buckets: Array<[string, number]> = [
    ["capability", capWeeks], ["integration", intWeeks], ["ai", aiWeeks],
    ["security", securityUplift], ["testing", testingUplift], ["other", envUplift + migrationUplift],
  ];
  const roleWeeks: Record<string, number> = {};
  const bucketSum = buckets.reduce((a, [, w]) => a + w, 0);
  const scale = bucketSum > 0 ? totalWeeks / bucketSum : 1; // allocate full total (incl. contingency + all uplifts) across roles
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
    rows, base, securityUplift, testingUplift, envUplift, migrationUplift, productivityUplift, cloudUplift,
    subtotal, contingency, totalWeeks, weeksLow, weeksHigh,
    cost, costLow: Math.round(cost * (1 - band)), costHigh: Math.round(cost * (1 + band)),
    confidence, band, reasons, limitation, missing, blocked, durationWeeks, durationLow, durationHigh, cfg,
    roles, roleCostTotal, milestones, deliveryRisks,
  };
}
