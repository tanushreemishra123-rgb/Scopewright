import type { ScopingPackage } from "../core/packageModel";
import { CLOUDS } from "../core/cloudMap";
import { PHASES } from "../core/estimate";

export function buildMarkdown(pkg: ScopingPackage): string {
  const { session: s, caps, arch, ai, data, integ, cov, est, gate, included } = pkg;
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

  if (arch) {
    p(`\n## Solution architecture — ${CLOUDS[arch.cloud]}`);
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
  p(`\nBase ${est.base} + security ${est.securityUplift} + testing ${est.testingUplift} + environments ${est.envUplift} + migration ${est.migrationUplift} = subtotal ${est.subtotal}; + contingency ${est.cfg.contingency}% (${est.contingency}) = **${est.totalWeeks} person-weeks**.`);
  p(`ROM = ${est.totalWeeks} × ${money(est.cfg.blendedRate)}/wk = ${money(est.cost)} (±${Math.round(est.band * 100)}%): **${money(est.costLow)}–${money(est.costHigh)}**. Confidence **${est.confidence}**${est.reasons.length ? ` (${est.reasons.join("; ")})` : ""}.`);
  p(`\n### Delivery phases`); PHASES.forEach((ph, i) => p(`${i + 1}. ${ph}`));

  p(`\n## Assumptions`); (s.assumptions || []).forEach(a => p(`- ${a.id}: ${a.text} _(${a.status})_`));
  p(`\n## Open questions`); (s.openQuestions || []).forEach(q => p(`- ${q.id}: ${q.text}${q.resolved ? ` — resolved: ${q.answer}` : " — unresolved"}`));

  p(`\n## Requirement coverage & quality gate`);
  p(`Coverage ${cov.pct}% (${cov.covered}/${cov.total}). Uncovered: ${cov.uncovered.map(r => r.id).join(", ") || "none"}. Dangling refs: ${cov.dangling.join(", ") || "none"}.`);
  gate.checks.forEach(c => p(`- [${c.ok ? "x" : " "}] ${c.label} — ${c.detail}`));
  p(`\n_Export status: ${gate.status}._`);
  return L.join("\n");
}
