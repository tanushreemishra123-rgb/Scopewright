// Stage 3 — Design the solution. Cloud-specific architecture mapped to the requirements
// that justify each component, with a tiered diagram, rationale and trade-offs. Requirement 3.
import React from "react";
import { CLOUDS } from "../core";
import { Chip, IdChip, Btn, Card, SectionTitle, Empty } from "./primitives";

function ArchStage({ ctx }) {
  const { session, cloud, setCloud, pkg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const arch = pkg.arch;
  const recommend = () => { const t = JSON.stringify(session).toLowerCase(); if (/entra|power bi|\.net|azure/.test(t)) setCloud("azure"); else if (/bigquery|vertex|gcp|google/.test(t)) setCloud("gcp"); else setCloud("aws"); };
  return <div>
    <SectionTitle sub="Cloud-specific services are mapped to the requirements that justify them. Every functional component references a requirement ID.">Design the solution architecture</SectionTitle>
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Cloud platform</span>
        {Object.entries(CLOUDS).map(([k, v]) => <button key={k} onClick={() => setCloud(k)} style={{ padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid " + (cloud === k ? "var(--accent)" : "var(--line-strong)"), background: cloud === k ? "var(--accent-soft)" : "var(--surface)", color: cloud === k ? "var(--accent-ink)" : "var(--ink)" }}>{v}</button>)}
        <Btn kind="soft" small onClick={recommend} style={{ marginLeft: "auto" }}>Recommend a platform</Btn>
      </div>
    </Card>
    {!cloud ? <Empty title="Select or recommend a cloud platform">The architecture is generated for a specific platform — its services and rationale depend on your choice.</Empty>
      : <div style={{ display: "grid", gap: 16 }}>
        <ArchDiagram arch={arch} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
          {arch.components.map(c => <Card key={c.key} pad={13}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent-ink)", fontFamily: "JetBrains Mono", margin: "3px 0 7px" }}>{c.service}</div>
            <p style={{ fontSize: 12.3, color: "var(--ink-soft)", margin: "0 0 7px" }}>{c.rationale}</p>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 3 }}><b>Trade-off:</b> {c.tradeoff}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 7 }}><b>Security:</b> {c.sec}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{c.reqIds.length ? c.reqIds.map(id => <IdChip key={id} id={id} />) : <Chip>cross-cutting</Chip>}</div></Card>)}
        </div>
        <div style={{ textAlign: "right" }}><Btn onClick={() => setStage("strategy")}>Plan data, integration &amp; AI →</Btn></div>
      </div>}
  </div>;
}
function ArchDiagram({ arch }) {
  const tiers = [{ t: "Experience", keys: ["web", "identity"] }, { t: "Application", keys: ["api", "compute", "cache", "events"] }, { t: "Data & AI", keys: ["rdb", "nosql", "storage", "vector", "ai"] }, { t: "Integration", keys: ["integ"] }, { t: "Platform", keys: ["obs", "security", "cicd"] }];
  const present = (k) => arch.components.find(c => c.key === k);
  return <Card pad={16}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 12 }}>Architecture overview — {CLOUDS[arch.cloud]}</div>
    <div style={{ display: "grid", gap: 9 }}>
      {tiers.map(row => { const comps = row.keys.map(present).filter(Boolean); if (!comps.length) return null;
        return <div key={row.t} style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
          <div style={{ width: 88, flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", display: "flex", alignItems: "center" }}>{row.t}</div>
          <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>{comps.map(c => <div key={c.key} style={{ flex: "1 1 150px", minWidth: 130, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10.5, color: "var(--accent-ink)", fontFamily: "JetBrains Mono", marginTop: 2 }}>{c.service}</div></div>)}</div></div>;
      })}
    </div>
    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>Data flows top-to-bottom; the integration tier connects to external systems; the platform tier is cross-cutting.</div>
  </Card>;
}

export default ArchStage;
