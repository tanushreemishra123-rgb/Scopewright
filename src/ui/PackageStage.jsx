// Stage 6 — Validate & package. Change-impact (affected vs preserved), the pre-export
// quality gate, and integrated export (Markdown/DOCX/PDF) with disclaimer. Requirements 6 & 10.
import React, { useState } from "react";
import { CLOUDS, DISCLAIMER } from "../core";
import { computeChangeImpact } from "../core/changeImpact";
import { exportMarkdown, exportDocx, exportPdfViaPrint } from "../export";
import { Chip, Btn, Card, SectionTitle, Empty } from "./primitives";

function PackageStage({ ctx }) {
  const { session, setSession, pkg, cloud, setCloud, estCfg, setEstCfg } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const { gate, cov } = pkg; const [impact, setImpact] = useState(null);
  const applyChange = (type) => { const r = computeChangeImpact(session, estCfg, cloud, type); setSession(r.session); setEstCfg(r.cfg); setCloud(r.cloud); setImpact(r.impact); };

  return <div>
    <SectionTitle sub="Change a key input to see exactly which outputs are affected — reviewed, unaffected content is preserved. Then run the quality gate before export.">Validate &amp; prepare the scoping package</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Change-impact analysis</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <Btn small kind="soft" onClick={() => applyChange("users")}>User volume ×10</Btn>
          <Btn small kind="soft" onClick={() => applyChange("cloud")}>Switch cloud</Btn>
          <Btn small kind="soft" onClick={() => applyChange("contingency")}>Contingency → 30%</Btn>
          <Btn small kind="soft" onClick={() => applyChange("scope")}>Drop a low-priority req</Btn>
        </div>
        {impact ? <div className="fadein"><div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{impact.desc}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--warn-soft)", borderRadius: 8, padding: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", marginBottom: 5 }}>Affected — recalculated</div>{impact.affected.map((x, i) => <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {x}</div>)}</div>
            <div style={{ background: "var(--ok-soft)", borderRadius: 8, padding: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--ok)", marginBottom: 5 }}>Unaffected — preserved</div>{impact.unaffected.map((x, i) => <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {x}</div>)}</div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>Affected outputs above have already recalculated from the shared model.</div></div>
          : <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Apply a change to see the impact map.</div>}
      </Card>
      <Card><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 700 }}>Pre-export quality gate</span><Chip c={gate.status === "Ready to export" ? "var(--ok)" : gate.status === "Blocked" ? "var(--bad)" : "var(--warn)"} b={gate.status === "Ready to export" ? "var(--ok-soft)" : gate.status === "Blocked" ? "var(--bad-soft)" : "var(--warn-soft)"}>{gate.status}</Chip></div>
        <div style={{ display: "grid", gap: 6 }}>{gate.checks.map((c, i) => <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.3 }}><span style={{ color: c.ok ? "var(--ok)" : "var(--warn)", fontWeight: 700, marginTop: 1 }}>{c.ok ? "✓" : "!"}</span><div><div style={{ fontWeight: 600 }}>{c.label}</div><div style={{ color: "var(--ink-soft)", fontSize: 11.8 }}>{c.detail}</div></div></div>)}</div>
      </Card>
    </div>

    <Card style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div><div style={{ fontSize: 14, fontWeight: 700 }}>Integrated solution-scoping package</div><div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Executive summary · requirements · PRD · architecture ({cloud ? CLOUDS[cloud] : "no cloud selected"}) · data/integration/AI · estimate &amp; ROM · coverage &amp; quality gate.</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="ghost" small onClick={() => exportPdfViaPrint(pkg)}>PDF (print)</Btn>
          <Btn kind="ghost" small onClick={() => exportDocx(pkg)}>DOCX</Btn>
          <Btn onClick={() => exportMarkdown(pkg)}>Export Markdown</Btn>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: 10, background: "var(--surface-3)", borderRadius: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>{DISCLAIMER}</div>
    </Card>
  </div>;
}

export default PackageStage;
