// Stage 5 — Estimate the delivery. Reproducible effort/ROM from visible scope factors,
// role/skill breakdown, phase milestones, delivery risks and confidence flags. Requirement 5.
import React from "react";
import { PHASES } from "../core";
import { PRIO, Chip, Btn, Card, SectionTitle, Empty } from "./primitives";

const inp = { width: "100%", padding: "7px 9px", border: "1px solid var(--line-strong)", borderRadius: 7, background: "var(--surface-2)", fontSize: 13 };
const Field = ({ label, children }) => <div style={{ marginBottom: 11 }}><div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>{label}</div>{children}</div>;
function EstimateStage({ ctx }) {
  const { pkg, estCfg, setEstCfg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const est = pkg.est; const money = (n) => `${estCfg.currency} ${n.toLocaleString()}`; const set = (k, v) => setEstCfg({ ...estCfg, [k]: v });
  return <div>
    <SectionTitle sub="Effort, timeline and ROM are computed from visible scope factors and configurable rates — not generated as free-text numbers. Change any factor and everything recalculates.">Estimate the delivery</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <Card pad={0}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ color: "var(--ink-faint)", textAlign: "left" }}>{["Workstream", "Complexity", "Person-weeks", "Driver"].map(h => <th key={h} style={{ padding: "9px 12px", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{h}</th>)}</tr></thead>
          <tbody>{est.rows.map((r, i) => <tr key={i}><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>{r.label}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)" }}><Chip c={PRIO[r.complexity].c} b={PRIO[r.complexity].b}>{r.complexity}</Chip></td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{r.weeks}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--ink-soft)" }}>{r.driver}</td></tr>)}</tbody>
        </table></Card>
        <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Calculation (reproducible)</div>
          <div className="mono" style={{ fontSize: 12.5, lineHeight: 1.9, color: "var(--ink-soft)" }}>
            <div>base workstreams … <b style={{ color: "var(--ink)" }}>{est.base} pw</b></div>
            <div>+ security uplift (10% if ≥2 sec reqs) … {est.securityUplift} pw</div>
            <div>+ testing &amp; hardening (15%) … {est.testingUplift} pw</div>
            <div>+ environments ({estCfg.environments}) … {est.envUplift} pw</div>
            <div>+ data migration … {est.migrationUplift} pw</div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 4, marginTop: 4 }}>subtotal … <b style={{ color: "var(--ink)" }}>{est.subtotal} pw</b></div>
            <div>+ contingency ({estCfg.contingency}%) … {est.contingency} pw</div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 4, marginTop: 4, fontSize: 14 }}>total … <b style={{ color: "var(--accent-ink)" }}>{est.totalWeeks} person-weeks</b> <span style={{ color: "var(--ink-faint)" }}>(range {est.weeksLow}–{est.weeksHigh})</span></div>
            <div style={{ marginTop: 6 }}>ROM = {est.totalWeeks} × {money(estCfg.blendedRate)}/wk = <b style={{ color: "var(--ink)" }}>{money(est.cost)}</b></div>
            <div>range (±{Math.round(est.band * 100)}%) = <b style={{ color: "var(--accent-ink)" }}>{money(est.costLow)} – {money(est.costHigh)}</b></div>
          </div></Card>
        <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Role / skill breakdown <span style={{ fontWeight: 400, color: "var(--ink-faint)", fontSize: 11.5 }}>(indicative allocation of {est.totalWeeks} pw)</span></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ color: "var(--ink-faint)", textAlign: "left" }}>{["Role", "Person-weeks", "Weekly rate", "Indicative cost"].map(h => <th key={h} style={{ padding: "6px 8px", fontSize: 10.5, borderBottom: "1px solid var(--line)" }}>{h}</th>)}</tr></thead>
            <tbody>{est.roles.map(r => <tr key={r.role}><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>{r.role}</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", fontFamily: "JetBrains Mono" }}>{r.weeks}</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", color: "var(--ink-soft)" }}>{money(r.weeklyRate)}</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", fontFamily: "JetBrains Mono" }}>{money(r.cost)}</td></tr>)}</tbody>
          </table>
          <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>Indicative role costing (rate card × mix); the headline ROM above uses the configured blended rate.</div></Card>

        <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Delivery phases &amp; milestones</div>
          <div style={{ display: "grid", gap: 6 }}>{est.milestones.map((m, i) => <div key={m.phase} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent-ink)", width: 26 }}>P{i + 1}</span>
            <span style={{ flex: 1, fontSize: 12.5 }}>{m.phase}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontFamily: "JetBrains Mono" }}>~wk {m.endWeek}</span></div>)}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>~{est.durationWeeks} weeks elapsed with a team of {estCfg.teamSize} (up to 4 parallel workstreams).</div></Card>

        {est.deliveryRisks.length > 0 && <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Delivery risks &amp; dependencies</div>
          {est.deliveryRisks.map(r => <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 6 }}>
            <Chip c={PRIO[r.severity].c} b={PRIO[r.severity].b}>{r.severity}</Chip>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}><b style={{ color: "var(--ink)" }}>{r.category}.</b> {r.description}</div></div>)}</Card>}
      </div>
      <div style={{ display: "grid", gap: 14, position: "sticky", top: 0 }}>
        <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Commercial configuration</div>
          <Field label={`Blended rate / person-week (${estCfg.currency})`}><input type="number" value={estCfg.blendedRate} onChange={e => set("blendedRate", +e.target.value)} style={inp} /></Field>
          <Field label="Currency"><select value={estCfg.currency} onChange={e => set("currency", e.target.value)} style={inp}><option>EUR</option><option>USD</option><option>GBP</option><option>INR</option></select></Field>
          <Field label={`Contingency: ${estCfg.contingency}%`}><input type="range" min="0" max="40" value={estCfg.contingency} onChange={e => set("contingency", +e.target.value)} style={{ width: "100%" }} /></Field>
          <Field label={`Team size: ${estCfg.teamSize}`}><input type="range" min="2" max="14" value={estCfg.teamSize} onChange={e => set("teamSize", +e.target.value)} style={{ width: "100%" }} /></Field>
          <Field label={`Environments: ${estCfg.environments}`}><input type="range" min="1" max="4" value={estCfg.environments} onChange={e => set("environments", +e.target.value)} style={{ width: "100%" }} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginTop: 6 }}><input type="checkbox" checked={estCfg.dataMigration} onChange={e => set("dataMigration", e.target.checked)} /> Data migration required (+8 pw)</label>
        </Card>
        <Card style={{ borderColor: est.confidence === "High" ? "var(--ok-soft)" : est.confidence === "Low" ? "var(--bad-soft)" : "var(--warn-soft)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 700 }}>Confidence</span><Chip c={est.confidence === "High" ? "var(--ok)" : est.confidence === "Low" ? "var(--bad)" : "var(--warn)"} b={est.confidence === "High" ? "var(--ok-soft)" : est.confidence === "Low" ? "var(--bad-soft)" : "var(--warn-soft)"}>{est.confidence}</Chip></div>
          {est.reasons.length > 0 && <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12, color: "var(--ink-soft)" }}>{est.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
          {est.missing.length > 0 && <div style={{ marginTop: 8, padding: 8, background: "var(--bad-soft)", borderRadius: 7, fontSize: 12, color: "var(--bad)" }}><b>Missing inputs:</b> {est.missing.join("; ")}. ROM flagged low-confidence.</div>}
        </Card>
        <Btn onClick={() => setStage("package")}>Validate &amp; package →</Btn>
      </div>
    </div>
  </div>;
}

export default EstimateStage;
