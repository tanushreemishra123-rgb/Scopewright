import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { ScopingPackage } from "../core/packageModel";
import { CLOUDS } from "../core/cloudMap";
import { PHASES } from "../core/estimate";

/** Build a Word (.docx) scoping package and return a Blob (browser). */
export async function buildDocxBlob(pkg: ScopingPackage): Promise<Blob> {
  const { session: s, caps, arch, ai, data, integ, cov, est, gate, included } = pkg;
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

  kids.push(H("Requirements"));
  included.forEach(r => kids.push(B(`${r.id} [${r.type}/${r.priority}/${r.classification}] ${r.description}`)));

  kids.push(H("Functional scope"));
  caps.forEach(c => kids.push(B(`${c.name} (${c.priority}) — ${c.reqs.join(", ")}: ${c.scope}`)));

  kids.push(H(`Solution architecture${arch ? " — " + CLOUDS[arch.cloud] : ""}`));
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
  kids.push(P(`Subtotal ${est.subtotal} + contingency ${est.cfg.contingency}% = ${est.totalWeeks} person-weeks. ROM ${money(est.costLow)}–${money(est.costHigh)}.`));
  kids.push(H("Delivery phases", HeadingLevel.HEADING_2));
  PHASES.forEach((ph, i) => kids.push(B(`Phase ${i + 1}: ${ph}`)));

  kids.push(H("Requirement coverage & quality gate"));
  kids.push(P(`Coverage ${cov.pct}% (${cov.covered}/${cov.total}). Uncovered: ${cov.uncovered.map(r => r.id).join(", ") || "none"}.`));
  gate.checks.forEach(c => kids.push(B(`${c.ok ? "PASS" : "REVIEW"} — ${c.label}: ${c.detail}`)));

  const doc = new Document({ sections: [{ children: kids }] });
  return Packer.toBlob(doc);
}
