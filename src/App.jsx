// Application shell (Requirement 6 UX): holds the global scope model, cloud selection and
// estimate config; persists them to localStorage; routes between the six workspace stages;
// and renders the sidebar rail + header. The integrated package is assembled once via
// assemblePackage() and passed to each stage, so every deliverable derives from one model.
// Stage screens live in ./ui/*; shared primitives in ./ui/primitives.
import React, { useState, useEffect, useMemo } from "react";
import { DEFAULT_EST, assemblePackage } from "./core";
import { provider } from "./ui/provider";
import { Logo, Chip } from "./ui/primitives";
import Landing from "./ui/Landing";
import RequirementsStage from "./ui/RequirementsStage";
import PRDStage from "./ui/PRDStage";
import ArchStage from "./ui/ArchitectureStage";
import StrategyStage from "./ui/StrategyStage";
import EstimateStage from "./ui/EstimateStage";
import PackageStage from "./ui/PackageStage";

const STAGES = [
  { id: "requirements", n: "Understand the need", short: "Requirements" },
  { id: "prd", n: "Review the scope", short: "PRD & Scope" },
  { id: "architecture", n: "Design the solution", short: "Architecture" },
  { id: "strategy", n: "Plan data, integration & AI", short: "Data · Integration · AI" },
  { id: "estimate", n: "Estimate the delivery", short: "Estimate & ROM" },
  { id: "package", n: "Validate & package", short: "Package & Export" },
];

/* ---------- root ---------- */
export default function App() {
  const [session, setSession] = useState(null);
  const [stage, setStage] = useState("requirements");
  const [cloud, setCloud] = useState("");
  const [estCfg, setEstCfg] = useState(DEFAULT_EST);
  const [nav, setNav] = useState(true);

  useEffect(() => { try { const raw = localStorage.getItem("scopewright"); if (raw) { const d = JSON.parse(raw); if (d.session) { setSession(d.session); setStage(d.stage || "requirements"); setCloud(d.cloud || ""); setEstCfg({ ...DEFAULT_EST, ...(d.estCfg || {}) }); } } } catch (e) {} }, []);
  useEffect(() => { try { localStorage.setItem("scopewright", JSON.stringify({ session, stage, cloud, estCfg })); } catch (e) {} }, [session, stage, cloud, estCfg]);

  const pkg = useMemo(() => (session && session.approved) ? assemblePackage(session, cloud, estCfg) : null, [session, cloud, estCfg]);
  const ctx = { session, setSession, stage, setStage, cloud, setCloud, estCfg, setEstCfg, pkg };

  if (!session) return <Landing onStart={(s) => { setSession(s); setCloud(s.context.cloud || ""); setStage("requirements"); }} />;

  const stageIdx = STAGES.findIndex(s => s.id === stage);
  const locked = (i) => i > 0 && !session.approved;

  return <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    {nav && <aside style={{ width: 250, flexShrink: 0, borderRight: "1px solid var(--line)", background: "var(--surface)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <Logo /><div><div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15 }}>Scopewright</div><div style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>Deal Scoping Assistant</div></div>
      </div>
      <div style={{ padding: "10px 12px", flex: 1, overflowY: "auto" }}>
        {STAGES.map((s, i) => {
          const active = s.id === stage, done = session.approved && i < stageIdx, isLocked = locked(i);
          return <button key={s.id} onClick={() => !isLocked && setStage(s.id)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "flex-start", padding: "10px", borderRadius: 9, border: "none", marginBottom: 2, cursor: isLocked ? "not-allowed" : "pointer", background: active ? "var(--accent-soft)" : "transparent", opacity: isLocked ? .45 : 1 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700, fontFamily: "JetBrains Mono", background: active ? "var(--accent)" : done ? "var(--stated)" : "var(--surface-3)", color: active || done ? "#fff" : "var(--ink-soft)" }}>{done ? "✓" : i + 1}</span>
            <span style={{ lineHeight: 1.25 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: active ? "var(--accent-ink)" : "var(--ink)" }}>{s.short}</span><span style={{ display: "block", fontSize: 11, color: "var(--ink-faint)" }}>{s.n}</span></span>
          </button>;
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)" }}>
        <Chip c="var(--warn)" b="var(--warn-soft)">● {provider.label} mode</Chip>
        <button onClick={() => { if (confirm("Start a new session? Current work is cleared.")) { localStorage.removeItem("scopewright"); setSession(null); } }} style={{ marginTop: 10, width: "100%", fontSize: 12, color: "var(--ink-soft)", background: "none", border: "1px solid var(--line)", borderRadius: 7, padding: 6 }}>New session</button>
      </div>
    </aside>}

    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ height: 56, flexShrink: 0, borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 14, padding: "0 20px" }}>
        <button onClick={() => setNav(v => !v)} title="Toggle rail" style={{ background: "none", border: "1px solid var(--line)", borderRadius: 7, padding: "5px 8px", color: "var(--ink-soft)" }}>☰</button>
        <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</div><div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{session.context.customer} · {session.tag}</div></div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {pkg && <Chip c={pkg.cov.pct >= 90 ? "var(--ok)" : "var(--warn)"} b={pkg.cov.pct >= 90 ? "var(--ok-soft)" : "var(--warn-soft)"}>Coverage {pkg.cov.pct}%</Chip>}
          {pkg && <Chip c={pkg.gate.status === "Ready to export" ? "var(--ok)" : pkg.gate.status === "Blocked" ? "var(--bad)" : "var(--warn)"} b={pkg.gate.status === "Ready to export" ? "var(--ok-soft)" : pkg.gate.status === "Blocked" ? "var(--bad-soft)" : "var(--warn-soft)"}>{pkg.gate.status}</Chip>}
        </div>
      </header>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="fadein" key={stage} style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 28px 90px" }}>
          {stage === "requirements" && <RequirementsStage ctx={ctx} />}
          {stage === "prd" && <PRDStage ctx={ctx} />}
          {stage === "architecture" && <ArchStage ctx={ctx} />}
          {stage === "strategy" && <StrategyStage ctx={ctx} />}
          {stage === "estimate" && <EstimateStage ctx={ctx} />}
          {stage === "package" && <PackageStage ctx={ctx} />}
        </div>
      </div>
    </main>
  </div>;
}
