import type { ScopingPackage } from "../core/packageModel";
import { CLOUDS } from "../core/cloudMap";
import { PHASES, formatMoney } from "../core/estimate";

export function buildMarkdown(pkg: ScopingPackage): string {
  const { session: s, caps, arch, ai, data, integ, cov, est, gate, included, prdExtras, risks, personas, journeys } = pkg;
  const L: string[] = []; const p = (x: string) => L.push(x);
  const money = (n: number) => formatMoney(n, est.cfg.currency);

  p(`# Solution Scoping Package — ${s.name}`);
  p(`\n> ${pkg.disclaimer}\n`);
  p(`## Executive summary`);
  p(`Customer: **${s.context.customer}**. Opportunity: ${s.context.opportunity}.`);
  p(`Scope: ${caps.length} capabilities, ${included.filter(r => r.type === "Integration").length} integrations, ${(s.aiUseCases || []).length} AI use case(s). Estimated effort **${est.totalWeeks} person-weeks** (~${est.durationWeeks} weeks elapsed with a team of ${est.cfg.teamSize}). ROM: **${money(est.costLow)}–${money(est.costHigh)}** (${est.confidence} confidence). Requirement coverage: **${cov.pct}%**. Export status: **${gate.status}**.`);

  // ---- Grounding & sources (information hierarchy) ----
  const nStated = included.filter(r => r.classification === "customer-stated").length;
  const nInferred = included.filter(r => r.classification === "ai-inferred").length;
  const nAssumed = included.filter(r => r.classification === "assumed").length;
  const nConfirmed = (s.assumptions || []).filter(a => a.status === "confirmed").length;
  const nReview = (s.assumptions || []).filter(a => a.status === "needs-review").length;
  const nOpen = (s.openQuestions || []).filter(q => !q.resolved).length;
  p(`\n## Grounding & sources`);
  p(`Outputs are grounded in a clear information hierarchy:`);
  p(`- **Primary — customer requirements:** ${nStated} of ${included.length} requirements are customer-stated, each traceable to source text.`);
  p(`- **Secondary — user-reviewed assumptions & configuration:** ${(s.assumptions || []).length} assumptions (${nConfirmed} confirmed, ${nReview} need review); config — cloud ${s.context.cloud ? CLOUDS[s.context.cloud as keyof typeof CLOUDS] || s.context.cloud : "not selected"}, rate ${money(est.cfg.blendedRate)}/wk, contingency ${est.cfg.contingency}%, currency ${est.cfg.currency}.`);
  p(`- **AI-generated recommendations (clearly labeled):** ${nInferred} AI-inferred and ${nAssumed} assumed requirement(s); ${nOpen} unresolved clarification question(s) record gaps rather than inventing facts.`);

  p(`\n## Requirements (${included.length})`);
  p(`| ID | Type | Priority | Source class | Description |\n|---|---|---|---|---|`);
  included.forEach(r => p(`| ${r.id} | ${r.type} | ${r.priority} | ${r.classification} | ${r.description} |`));

  p(`\n## Functional scope`);
  caps.forEach(c => p(`- **${c.name}** (${c.priority}, ${c.complexity} complexity) — reqs ${c.reqs.join(", ")}. ${c.scope}${c.dependencies.length ? ` _Depends on:_ ${c.dependencies.join(", ")}.` : ""}`));

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
    arch.components.forEach(c => p(`- **${c.name}** → ${c.service} — supports ${c.reqIds.join(", ") || "cross-cutting"}. ${c.rationale}${c.deps.length ? ` _Depends on:_ ${c.deps.join(", ")}.` : ""}`));
  } else p(`\n## Solution architecture\n_No cloud platform selected._`);

  p(`\n## Data strategy`);
  data.points.forEach(x => p(`- **${x.k}:** ${x.v}`));
  p(`\n## Integration architecture`);
  integ.items.forEach(x => p(`- **${x.id}** ${x.name} — ${x.mode} (${x.systems}).`));
  p(`\n## AI solution approach`);
  if (ai.aiRequirements.length) p(`- **AI-specific requirements:** ${ai.aiRequirements.map((r: any) => r.id).join(", ")}.`);
  ai.cases.forEach(u => p(`- **${u.title}** (${u.reqs.join(", ")}) — ${u.pattern}. Human: ${u.human}. Deterministic: ${u.deterministic}`));
  p(`- **Recommended framework:** ${ai.framework.name} — ${ai.framework.why}`);
  p(`- **Model / provider options:** Managed — ${ai.models.managed} Open-weight — ${ai.models.open} (${ai.models.why})`);
  p(`- **Orchestration:** ${ai.orchestration}`);
  p(`- **Prompt & structured-output management:** ${ai.prompt}`);
  p(`- **Retrieval:** ${ai.retrieval}`);
  p(`- **Where deterministic instead of AI:** ${ai.deterministic.join(" ")}`);
  p(`- **Evaluation:** ${ai.evaluation}`);
  p(`- **Monitoring & feedback:** ${ai.monitoring}`);
  p(`- **Data privacy:** ${ai.privacy}`);
  p(`- **Responsible AI:** ${ai.responsible.join(" ")}`);

  p(`\n## Effort, timeline & ROM`);
  p(`| Item | Complexity | Person-weeks | Driver |\n|---|---|---|---|`);
  est.rows.forEach(r => p(`| ${r.label} | ${r.complexity} | ${r.weeks} | ${r.driver} |`));
  p(`\nBase ${est.base} + security ${est.securityUplift} + testing ${est.testingUplift} + environments ${est.envUplift} + migration ${est.migrationUplift} + cloud-complexity(${est.cfg.cloudComplexity}) ${est.cloudUplift} + productivity(×${est.cfg.productivity.toFixed(2)}) ${est.productivityUplift} = subtotal ${est.subtotal}; + contingency ${est.cfg.contingency}% (${est.contingency}) = **${est.totalWeeks} person-weeks** (range ${est.weeksLow}–${est.weeksHigh}). Timeline ~${est.durationLow}–${est.durationHigh} weeks.`);
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
  p(`| Requirement Coverage | Uncovered | Unresolved Questions | Unsupported Recommendations | Estimate Confidence | Export Status |`);
  p(`|---|---|---|---|---|---|`);
  p(`| ${gate.summary.coveragePct}% | ${gate.summary.uncovered} | ${gate.summary.unresolved} | ${gate.summary.unsupported} | ${gate.summary.confidence} | ${gate.summary.status} |`);
  p(`\nCoverage ${cov.pct}% (${cov.covered}/${cov.total}). Uncovered: ${cov.uncovered.map(r => r.id).join(", ") || "none"}. Dangling refs: ${cov.dangling.join(", ") || "none"}.`);
  gate.checks.forEach(c => p(`- [${c.ok ? "x" : " "}] ${c.label} — ${c.detail}`));
  p(`\n_Export status: ${gate.status}._`);
  return L.join("\n");
}
