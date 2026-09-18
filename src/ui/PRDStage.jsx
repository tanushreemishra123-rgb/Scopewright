// Stage 2 — Review the scope. PRD + functional scope generated from the approved model:
// capabilities (each citing requirement IDs), personas, journeys, risks, coverage. Requirement 2.
import React from "react";
import { includedReqs } from "../core";
import { PRIO, Chip, IdChip, Btn, Card, SectionTitle, Empty } from "./primitives";

function PRDStage({ ctx }) {
  const { session, pkg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const { caps, cov, personas, journeys, prdExtras, risks } = pkg; const inc = includedReqs(session);
  const group = (t) => inc.filter(r => r.type === t);
  return <div>
    <SectionTitle sub="Generated from the approved scope model. Capabilities reference requirement IDs; the coverage view flags anything not yet organized into scope.">Generate the PRD &amp; functional scope</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <Card><h3 style={{ fontSize: 15, marginBottom: 6 }}>Overview</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 4px" }}><b style={{ color: "var(--ink)" }}>Problem.</b> {session.context.opportunity}.</p>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: 0 }}><b style={{ color: "var(--ink)" }}>Objective.</b> {group("Business").map(r => r.description).join(" ") || "Deliver the requested solution capabilities."}</p></Card>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", margin: "2px 2px 8px" }}>Functional scope — capabilities</div>
          <div style={{ display: "grid", gap: 9 }}>{caps.map(c => <Card key={c.name} pad={13}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span><Chip c={PRIO[c.priority].c} b={PRIO[c.priority].b}>{c.priority}</Chip><Chip>{c.complexity} complexity</Chip></div>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 7px" }}>{c.scope}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{c.reqs.map(id => <IdChip key={id} id={id} />)}</div></Card>)}</div></div>
        <Card><h3 style={{ fontSize: 14, marginBottom: 8 }}>Non-functional requirements</h3>
          {group("Non-functional").length ? group("Non-functional").map(r => <div key={r.id} style={{ fontSize: 13, marginBottom: 5 }}><IdChip id={r.id} /> {r.description}</div>) : <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>None captured — consider clarifying performance, availability and scale.</span>}</Card>

        {personas.length > 0 && <Card><h3 style={{ fontSize: 14, marginBottom: 8 }}>Target users &amp; personas</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
            {personas.map(p => <div key={p.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-faint)" }}>{p.id}</span></div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0" }}>{p.description}</div>
              <div style={{ fontSize: 11.5, color: "var(--accent-ink)" }}>Needs: {p.needs}</div></div>)}</div></Card>}

        {journeys.length > 0 && <Card><h3 style={{ fontSize: 14, marginBottom: 8 }}>User journeys</h3>
          {journeys.map(j => <div key={j.id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{j.name} <span style={{ marginLeft: 4 }}>{j.reqs.map(id => <IdChip key={id} id={id} />)}</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              {j.steps.map((s, i) => <React.Fragment key={i}><span style={{ fontSize: 11.5, background: "var(--surface-3)", borderRadius: 6, padding: "3px 8px" }}>{s}</span>{i < j.steps.length - 1 && <span style={{ color: "var(--ink-faint)" }}>→</span>}</React.Fragment>)}
            </div></div>)}</Card>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: "var(--inferred)" }}>Recommended enhancements</div>
            {prdExtras.enhancements.length ? prdExtras.enhancements.map(r => <div key={r.id} style={{ fontSize: 12, marginBottom: 3 }}><IdChip id={r.id} /> {r.description}</div>) : <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>None.</span>}</Card>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Out of scope</div>
            {prdExtras.outOfScope.length ? prdExtras.outOfScope.map((x, i) => <div key={i} style={{ fontSize: 12, marginBottom: 3, color: "var(--ink-soft)" }}>• {x}</div>) : <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Nothing excluded yet.</span>}</Card>
        </div>

        {prdExtras.dependencies.length > 0 && <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Dependencies</div>
          {prdExtras.dependencies.map((d, i) => <div key={i} style={{ fontSize: 12, marginBottom: 2 }}><IdChip id={d.from} /> depends on {d.to.map(t => <IdChip key={t} id={t} />)}</div>)}</Card>}

        {risks.length > 0 && <Card><h3 style={{ fontSize: 14, marginBottom: 8 }}>Risks</h3>
          {risks.map(r => <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
            <Chip c={PRIO[r.severity].c} b={PRIO[r.severity].b}>{r.severity}</Chip>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12.5 }}><span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--ink-faint)" }}>{r.id}</span> · <span style={{ color: "var(--ink-faint)" }}>{r.category}</span> — {r.description}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Mitigation: {r.mitigation}{r.reqs.length ? <> · {r.reqs.map(id => <IdChip key={id} id={id} />)}</> : null}</div></div></div>)}</Card>}
      </div>
      <div style={{ display: "grid", gap: 14, position: "sticky", top: 0 }}>
        <Card><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><h3 style={{ fontSize: 14 }}>Requirement coverage</h3><Chip c={cov.pct >= 90 ? "var(--ok)" : "var(--warn)"} b={cov.pct >= 90 ? "var(--ok-soft)" : "var(--warn-soft)"} mono>{cov.pct}%</Chip></div>
          <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}><div style={{ width: cov.pct + "%", height: "100%", background: "var(--stated)" }} /></div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{cov.covered} of {cov.total} requirements are organized into a capability or component.</div>
          {cov.uncovered.length > 0 && <div style={{ marginTop: 10, padding: 10, background: "var(--warn-soft)", borderRadius: 8 }}><div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--warn)" }}>Uncovered</div><div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>{cov.uncovered.map(r => <IdChip key={r.id} id={r.id} />)}</div></div>}</Card>
        <Card><h3 style={{ fontSize: 14, marginBottom: 8 }}>Scope boundaries</h3>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
            <div style={{ marginBottom: 6 }}><b style={{ color: "var(--assumed)" }}>Assumed / to confirm:</b> {inc.filter(r => r.classification === "assumed").map(r => r.id).join(", ") || "—"}</div>
            <div><b style={{ color: "var(--inferred)" }}>AI-inferred additions:</b> {inc.filter(r => r.classification === "ai-inferred").map(r => r.id).join(", ") || "—"}</div></div></Card>
        <Btn onClick={() => setStage("architecture")}>Design the solution →</Btn>
      </div>
    </div>
  </div>;
}

export default PRDStage;
