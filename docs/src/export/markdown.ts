import type { ScopingPackage } from "../core/packageModel";
import { CLOUDS } from "../core/cloudMap";
import { PHASES } from "../core/estimate";

export function buildMarkdown(pkg: ScopingPackage): string {
  const { session: s, caps, arch, ai, data, integ, cov, est, gate, included, prdExtras, risks, personas, journeys } = pkg;
  const L: string[] = []; const p = (x: string) => L.push(x);
  const money = (n: number) => `${est.cfg.currency} ${n.toLocaleString()}`;

  p(`# Solution Scoping Package — ${s.name}`);
  p(`\n> ${pkg.disclaimer}\n`);
  p(`## Executive summary`);
  p(`Customer: **${s.context.customer}**. Opportunity: ${s.context.opportunity}.`);
  p(`Scope: ${caps.length} capabilities, ${included.filter(r => r.type === "Integration").length} integrations, ${(s.aiUseCases || []).length} AI use case(s). Estimated effort **${est.totalWeeks} person-weeks** (~${est.durationWeeks} weeks elapsed with a team of ${est.cfg.teamSize}). ROM: **${money(est.costLow)}–${money(est.costHigh)}** (${est.confidence} confidence). Requirement coverage: **${cov.pct}%**. Export status: **${gate.status}**.`);

  p(`\n## Requirements (${included.length})`);
  p(`| ID | Type | Priority | Source class | Description |\n|---|---|---|---|---|`);
  included.forEach(r => p(`| ${r.id} | ${r.type} | ${r.priority} | ${r.classification} | ${r.description} |`));

  p(`\n## Functional scope`);
  caps.forEach(c => p(`- **${c.name}** (${c.priority}, ${c.complexity} complexity) — reqs ${c.reqs.join(", ")}. ${c.scope}`));

  if (personas.length) { p(`\n## Target users & personas`); personas.forEach(pr => p(`- **${pr.name}** (${pr.id}) — ${pr.description} _Needs:_ ${pr.needs}`)); }
  if (journeys.length) { p(`\n## User journeys`); journeys.forEach(j => p(`- **${j.name}** (${j.id}, reqs ${j.reqs.join(", ")}): ${j.steps.join(" → ")}`)); }

  if (prdExtras.enhancements.length) { p(`\n## Recommended enhancements (AI-inferred — confirm)`); prdExtras.enhancements.forEach(r => p(`- ${r.id} — ${r.description}`)); }
  if (prdExtras.dependencies.length) { p(`\n## Dependencies`); prdExtras.dependencies.forEach(d => p(`- ${d.from} depends on ${d.to.join(", ")}`)); }
  if (prdExtras.outOfScope.length) { p(`\n## Out of scope`); prdExtras.outOfScope.forEach(x => p(`- ${x}`)); }

  if (arch) {
    p(`\n## Solution architecture — ${CLOUDS[arch.cloud]}`);
    // text architecture diagram (tiered)
    const tiers: Array<[string, string[]]> = [["Experience", ["web", "identity"]], ["Application", ["api", "compute", "cache", "events"]], ["Data & AI", ["rdb", "nosql", "storage", "vector", "ai"]], ["Integration", ["integ"]], ["Platform", ["obs", "security", "cicd"]]];
    p("```");
    tiers.forEach(([t, keys]) => {
      const names = keys.map(k => arch.components.find(c => c.key === k)).filter(Boolean).map((c: any) => c.name);
      if (names.length) p(`${t.padEnd(13)}| ${names.join("  ·  ")}`);
    });
    p("```");
    arch.components.forEach(c => p(`- **${c.name}** → ${c.service} — supports ${c.reqIds.join(", ") || "cross-cutting"}. ${c.rationale}`));
  } else p(`\n## Solution architecture\n_No cloud platform selected._`);

  p(`\n## Data strategy`);
  data.points.forEach(x => p(`- **${x.k}:** ${x.v}`));
  p(`\n## Integration architecture`);
  integ.items.forEach(x => p(`- **${x.id}** ${x.name} — ${x.mode} (${x.systems}).`));
  p(`\n## AI solution approach`);
  ai.cases.forEach(u => p(`- **${u.title}** (${u.reqs.join(", ")}) — ${u.pattern}. Human: ${u.human}. Deterministic: ${u.deterministic}`));
  p(`- **Recommended framework:** ${ai.framework.name} — ${ai.framework.why}`);
  p(`- **Responsible AI:** ${ai.responsible.join(" ")}`);

  p(`\n## Effort, timeline & ROM`);
  p(`| Item | Complexity | Person-weeks | Driver |\n|---|---|---|---|`);
  est.rows.forEach(r => p(`| ${r.label} | ${r.complexity} | ${r.weeks} | ${r.driver} |`));
  p(`\nBase ${est.base} + security ${est.securityUplift} + testing ${est.testingUplift} + environments ${est.envUplift} + migration ${est.migrationUplift} = subtotal ${est.subtotal}; + contingency ${est.cfg.contingency}% (${est.contingency}) = **${est.totalWeeks} person-weeks** (range ${est.weeksLow}–${est.weeksHigh}).`);
  p(`ROM = ${est.totalWeeks} × ${money(est.cfg.blendedRate)}/wk = ${money(est.cost)} (±${Math.round(est.band * 100)}%): **${money(est.costLow)}–${money(est.costHigh)}**. Confidence **${est.confidence}**${est.reasons.length ? ` (${est.reasons.join("; ")})` : ""}.`);

  p(`\n### Role / skill breakdown (indicative allocation of ${est.totalWeeks} pw)`);
  p(`| Role | Person-weeks | Weekly rate | Indicative cost |\n|---|---|---|---|`);
  est.roles.forEach(r => p(`| ${r.role} | ${r.weeks} | ${money(r.weeklyRate)} | ${money(r.cost)} |`));
  p(`\n### Delivery phases & milestones`);
  est.milestones.forEach((m, i) => p(`${i + 1}. ${m.phase} — target end ~week ${m.endWeek}`));
  if (est.deliveryRisks.length) { p(`\n### Delivery risks`); est.deliveryRisks.forEach((r: any) => p(`- ${r.id} [${r.severity}/${r.category}] ${r.description} — _mitigation:_ ${r.mitigation}`)); }

  if (risks.length) { p(`\n## Risks`); risks.forEach((r: any) => p(`- **${r.id}** [${r.severity}/${r.category}] ${r.description} — _mitigation:_ ${r.mitigation}${r.reqs && r.reqs.length ? ` (${r.reqs.join(", ")})` : ""}`)); }

  p(`\n## Assumptions`); (s.assumptions || []).forEach(a => p(`- ${a.id}: ${a.text} _(${a.status})_`));
  p(`\n## Open questions`); (s.openQuestions || []).forEach(q => p(`- ${q.id}: ${q.text}${q.resolved ? ` — resolved: ${q.answer}` : " — unresolved"}`));

  p(`\n## Requirement coverage & quality gate`);
  p(`Coverage ${cov.pct}% (${cov.covered}/${cov.total}). Uncovered: ${cov.uncovered.map(r => r.id).join(", ") || "none"}. Dangling refs: ${cov.dangling.join(", ") || "none"}.`);
  gate.checks.forEach(c => p(`- [${c.ok ? "x" : " "}] ${c.label} — ${c.detail}`));
  p(`\n_Export status: ${gate.status}._`);
  return L.join("\n");
}
