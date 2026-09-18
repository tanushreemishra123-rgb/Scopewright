import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { ScopingPackage } from "../core/packageModel";
import { CLOUDS } from "../core/cloudMap";
import { PHASES } from "../core/estimate";

/** Build a Word (.docx) scoping package and return a Blob (browser). */
export async function buildDocxBlob(pkg: ScopingPackage): Promise<Blob> {
  const { session: s, caps, arch, ai, data, integ, cov, est, gate, included, prdExtras, risks, personas, journeys } = pkg;
  const money = (n: number) => `${est.cfg.currency} ${n.toLocaleString()}`;
  const P = (t: string) => new Paragraph({ children: [new TextRun(t)] });
  const H = (t: string, level: any = HeadingLevel.HEADING_1) => new Paragraph({ text: t, heading: level });
  const B = (t: string) => new Paragraph({ text: t, bullet: { level: 0 } });

  const kids: Paragraph[] = [];
  kids.push(new Paragraph({ text: `Solution Scoping Package — ${s.name}`, heading: HeadingLevel.TITLE }));
  kids.push(new Paragraph({ children: [new TextRun({ text: pkg.disclaimer, italics: true, size: 18 })] }));

  kids.push(H("Executive summary"));
  kids.push(P(`Customer: ${s.context.customer}. Opportunity: ${s.context.opportunity}.`));
  kids.push(P(`Effort ${est.totalWeeks} person-weeks; ROM ${money(est.costLow)}–${money(est.costHigh)} (${est.confidence} confidence). Coverage ${cov.pct}%. Status: ${gate.status}.`));

  const nStated = included.filter(r => r.classification === "customer-stated").length;
  const nInferred = included.filter(r => r.classification === "ai-inferred").length;
  const nAssumed = included.filter(r => r.classification === "assumed").length;
  const nReview = (s.assumptions || []).filter(a => a.status === "needs-review").length;
  const nOpen = (s.openQuestions || []).filter(q => !q.resolved).length;
  kids.push(H("Grounding & sources"));
  kids.push(B(`Primary — customer requirements: ${nStated} of ${included.length} are customer-stated, each traceable to source text.`));
  kids.push(B(`Secondary — user-reviewed assumptions & configuration: ${(s.assumptions || []).length} assumptions (${nReview} need review); cloud, rate, contingency and currency are user-set.`));
  kids.push(B(`AI-generated recommendations (labeled): ${nInferred} AI-inferred, ${nAssumed} assumed; ${nOpen} unresolved clarification question(s) record gaps.`));

  kids.push(H("Requirements"));
  included.forEach(r => kids.push(B(`${r.id} [${r.type}/${r.priority}/${r.classification}] ${r.description}`)));

  kids.push(H("Functional scope"));
  caps.forEach(c => kids.push(B(`${c.name} (${c.priority}) — ${c.reqs.join(", ")}: ${c.scope}`)));

  if (personas.length) { kids.push(H("Target users & personas")); personas.forEach(pr => kids.push(B(`${pr.name} (${pr.id}) — ${pr.description} Needs: ${pr.needs}`))); }
  if (journeys.length) { kids.push(H("User journeys")); journeys.forEach(j => kids.push(B(`${j.name} (${j.id}) — ${j.steps.join(" -> ")} [${j.reqs.join(", ")}]`))); }
  if (prdExtras.enhancements.length) { kids.push(H("Recommended enhancements (AI-inferred)")); prdExtras.enhancements.forEach(r => kids.push(B(`${r.id} — ${r.description}`))); }
  if (prdExtras.dependencies.length) { kids.push(H("Dependencies")); prdExtras.dependencies.forEach(d => kids.push(B(`${d.from} depends on ${d.to.join(", ")}`))); }
  if (prdExtras.outOfScope.length) { kids.push(H("Out of scope")); prdExtras.outOfScope.forEach(x => kids.push(B(x))); }

  kids.push(H(`Solution architecture${arch ? " — " + CLOUDS[arch.cloud] : ""}`));
  if (arch) {
    const tiers: Array<[string, string[]]> = [["Experience", ["web", "identity"]], ["Application", ["api", "compute", "cache", "events"]], ["Data & AI", ["rdb", "nosql", "storage", "vector", "ai"]], ["Integration", ["integ"]], ["Platform", ["obs", "security", "cicd"]]];
    tiers.forEach(([t, keys]) => {
      const names = keys.map(k => arch.components.find(c => c.key === k)).filter(Boolean).map((c: any) => c.name);
      if (names.length) kids.push(new Paragraph({ children: [new TextRun({ text: `${t}: `, bold: true }), new TextRun(names.join("  ·  "))] }));
    });
  }
  (arch?.components || []).forEach(c => kids.push(B(`${c.name} → ${c.service} — supports ${c.reqIds.join(", ") || "cross-cutting"}. ${c.rationale}`)));

  kids.push(H("Data strategy"));
  data.points.forEach(x => kids.push(B(`${x.k}: ${x.v}`)));
  kids.push(H("Integration architecture"));
  integ.items.forEach(x => kids.push(B(`${x.id} ${x.name} — ${x.mode} (${x.systems})`)));
  kids.push(H("AI solution approach"));
  ai.cases.forEach(u => kids.push(B(`${u.title} (${u.reqs.join(", ")}) — ${u.pattern}`)));
  kids.push(B(`Recommended framework: ${ai.framework.name} — ${ai.framework.why}`));

  kids.push(H("Effort, timeline & ROM"));
  est.rows.forEach(r => kids.push(B(`${r.label} — ${r.complexity} — ${r.weeks} pw (${r.driver})`)));
  kids.push(P(`Subtotal ${est.subtotal} + contingency ${est.cfg.contingency}% = ${est.totalWeeks} person-weeks (range ${est.weeksLow}–${est.weeksHigh}). ROM ${money(est.costLow)}–${money(est.costHigh)}.`));
  kids.push(H("Role / skill breakdown", HeadingLevel.HEADING_2));
  est.roles.forEach(r => kids.push(B(`${r.role}: ${r.weeks} pw @ ${money(r.weeklyRate)}/wk = ${money(r.cost)}`)));
  kids.push(H("Delivery phases & milestones", HeadingLevel.HEADING_2));
  est.milestones.forEach((m, i) => kids.push(B(`Phase ${i + 1}: ${m.phase} — end ~week ${m.endWeek}`)));
  if (risks.length) { kids.push(H("Risks")); risks.forEach((r: any) => kids.push(B(`${r.id} [${r.severity}/${r.category}] ${r.description} — mitigation: ${r.mitigation}`))); }

  kids.push(H("Requirement coverage & quality gate"));
  kids.push(P(`Coverage ${cov.pct}% (${cov.covered}/${cov.total}). Uncovered: ${cov.uncovered.map(r => r.id).join(", ") || "none"}.`));
  gate.checks.forEach(c => kids.push(B(`${c.ok ? "PASS" : "REVIEW"} — ${c.label}: ${c.detail}`)));

  const doc = new Document({ sections: [{ children: kids }] });
  return Packer.toBlob(doc);
}
