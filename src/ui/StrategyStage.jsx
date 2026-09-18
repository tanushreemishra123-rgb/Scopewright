// Stage 4 — Plan data, integration & AI. Coordinated strategy derived from DATA/INT
// requirements and AI use cases; framework rationale + explicit deterministic boundary. Requirement 4.
import React, { useState } from "react";
import { Chip, IdChip, Btn, Card, SectionTitle, Empty } from "./primitives";

function StrategyStage({ ctx }) {
  const { pkg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const { data, integ, ai } = pkg; const [tab, setTab] = useState("data");
  return <div>
    <SectionTitle sub="Coordinated strategy derived from the data, integration and AI requirements in the approved scope.">Data, integration &amp; AI strategy</SectionTitle>
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>{[["data", "Plan the data flow"], ["integ", "Integration architecture"], ["ai", "Select the AI approach"]].map(([k, l]) => <Btn key={k} small kind={tab === k ? "primary" : "ghost"} onClick={() => setTab(k)}>{l}</Btn>)}</div>

    {tab === "data" && <div style={{ display: "grid", gap: 12 }}>
      <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Data domains</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{data.domains.map(d => <Chip key={d}>{d}</Chip>)}</div><div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-faint)" }}>Traces to {data.reqs.map(id => <IdChip key={id} id={id} />)}</div></Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>{data.points.map(x => <Card key={x.k} pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{x.k}</div><div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{x.v}</div></Card>)}</div>
    </div>}

    {tab === "integ" && <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>Integration flow</div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>External systems</div>
            {integ.items.length ? [...new Set(integ.items.flatMap(x => x.systems.split(", ")))].map(sys => <div key={sys} style={{ fontSize: 11, color: "var(--ink-soft)" }}>• {sys}</div>) : <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>none</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", color: "var(--ink-faint)", fontSize: 18 }}>⇄</div>
          <div style={{ flex: "1 1 200px", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-ink)", marginBottom: 5 }}>Integration / orchestration layer</div>
            {integ.items.map(x => <div key={x.id} style={{ fontSize: 11, color: "var(--ink-soft)" }}><span style={{ fontFamily: "JetBrains Mono", color: "var(--accent-ink)" }}>{x.id}</span> · {x.mode}</div>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", color: "var(--ink-faint)", fontSize: 18 }}>→</div>
          <div style={{ flex: "1 1 150px", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Solution platform</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>APIs · data stores · event backbone</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 8 }}>Auth via managed secrets; retries with backoff + dead-letter; per-integration monitoring.</div>
      </Card>
      {integ.items.length ? <Card pad={0}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ textAlign: "left", color: "var(--ink-faint)" }}>{["ID", "Integration", "Mode", "Systems"].map(h => <th key={h} style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)", fontSize: 11 }}>{h}</th>)}</tr></thead>
        <tbody>{integ.items.map(x => <tr key={x.id}><td style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)" }}><IdChip id={x.id} /></td><td style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)" }}>{x.name}</td><td style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)" }}><Chip>{x.mode}</Chip></td><td style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)", color: "var(--ink-soft)" }}>{x.systems}</td></tr>)}</tbody>
      </table></Card> : <Empty title="No integrations in scope">No integration requirements were identified.</Empty>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>{integ.concerns.map(x => <Card key={x.k} pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{x.k}</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{x.v}</div></Card>)}</div>
    </div>}

    {tab === "ai" && <div style={{ display: "grid", gap: 12 }}>
      {ai.cases.length ? <>
        {ai.cases.map(u => <Card key={u.id} pad={13}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}><IdChip id={u.id} /><span style={{ fontWeight: 600, fontSize: 14 }}>{u.title}</span><Chip>{u.pattern}</Chip></div>
          <div style={{ fontSize: 12.3, color: "var(--ink-soft)", display: "grid", gap: 3 }}><div><b style={{ color: "var(--stated)" }}>Human review:</b> {u.human}</div><div><b style={{ color: "var(--ink)" }}>Deterministic boundary:</b> {u.deterministic}</div><div>Supports {u.reqs.map(id => <IdChip key={id} id={id} />)}</div></div></Card>)}
        <Card style={{ borderColor: "var(--accent-soft)", background: "var(--accent-soft)" }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "var(--accent-ink)" }}>Recommended framework — {ai.framework.name}</div><div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{ai.framework.why}</div></Card>

        {ai.aiRequirements.length > 0 && <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>AI-specific requirements</div>
          <div style={{ display: "grid", gap: 3 }}>{ai.aiRequirements.map(r => <div key={r.id} style={{ fontSize: 12.3, color: "var(--ink-soft)" }}><IdChip id={r.id} /> {r.text}</div>)}</div></Card>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Model / provider options</div>
            <div style={{ fontSize: 12.3, color: "var(--ink-soft)", marginBottom: 3 }}><b>Managed:</b> {ai.models.managed}</div>
            <div style={{ fontSize: 12.3, color: "var(--ink-soft)", marginBottom: 3 }}><b>Open-weight:</b> {ai.models.open}</div>
            <div style={{ fontSize: 11.8, color: "var(--ink-faint)" }}>{ai.models.why}</div></Card>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Orchestration</div>
            <div style={{ fontSize: 12.3, color: "var(--ink-soft)", marginBottom: 6 }}>{ai.orchestration}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, margin: "4px 0 4px" }}>Prompt &amp; structured output</div>
            <div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.prompt}</div></Card>
        </div>

        <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Where deterministic processing is used instead of AI</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.deterministic.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}</ul></Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Retrieval &amp; evaluation</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)", marginBottom: 6 }}>{ai.retrieval}</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.evaluation}</div></Card>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Monitoring &amp; feedback</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.monitoring}</div></Card>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Responsible AI</div><ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.responsible.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}</ul></Card>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Data privacy</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.privacy}</div></Card>
        </div>
      </> : <Empty title="No AI use cases in scope">This solution is currently deterministic. Add an AI-oriented requirement to generate an AI approach.</Empty>}
    </div>}
    <div style={{ textAlign: "right", marginTop: 16 }}><Btn onClick={() => setStage("estimate")}>Estimate the delivery →</Btn></div>
  </div>;
}


export default StrategyStage;
