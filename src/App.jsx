import React, { useState, useEffect, useMemo } from "react";
import {
  CLOUDS, SCENARIOS, includedReqs, DEFAULT_EST, PHASES, assemblePackage, DISCLAIMER,
} from "./core";
import { computeChangeImpact } from "./core/changeImpact";
import { getProvider } from "./providers";
import { exportMarkdown, exportDocx, exportPdfViaPrint } from "./export";

const provider = getProvider();

/* ---------- primitives ---------- */
const CLS = {
  "customer-stated": { c: "var(--stated)", b: "var(--stated-soft)", label: "Customer-stated" },
  "ai-inferred": { c: "var(--inferred)", b: "var(--inferred-soft)", label: "AI-inferred" },
  assumed: { c: "var(--assumed)", b: "var(--assumed-soft)", label: "Assumed" },
};
const PRIO = { High: { c: "var(--hi)", b: "var(--hi-soft)" }, Medium: { c: "var(--md)", b: "var(--md-soft)" }, Low: { c: "var(--lo)", b: "var(--lo-soft)" } };

function Chip({ children, c, b, mono, title }) {
  return <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 6, color: c || "var(--ink-soft)", background: b || "var(--surface-3)", fontFamily: mono ? "JetBrains Mono, monospace" : "inherit", whiteSpace: "nowrap" }}>{children}</span>;
}
const IdChip = ({ id }) => <Chip mono c="var(--accent-ink)" b="var(--accent-soft)">{id}</Chip>;
function Btn({ children, onClick, kind = "primary", disabled, small, style }) {
  const base = { border: "1px solid transparent", borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", padding: small ? "5px 11px" : "9px 15px", fontSize: small ? 12.5 : 13.5, transition: "background .15s", opacity: disabled ? .5 : 1 };
  const kinds = { primary: { background: "var(--accent)", color: "#fff" }, ghost: { background: "transparent", color: "var(--ink)", border: "1px solid var(--line-strong)" }, soft: { background: "var(--surface-3)", color: "var(--ink)" }, danger: { background: "var(--bad-soft)", color: "var(--bad)" } };
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}
const Card = ({ children, style, pad = 16 }) => <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: pad, boxShadow: "var(--shadow)", ...style }}>{children}</div>;
function SectionTitle({ children, sub }) {
  return <div style={{ marginBottom: 14 }}><h2 style={{ fontSize: 19 }}>{children}</h2>{sub && <p style={{ color: "var(--ink-soft)", margin: "3px 0 0", fontSize: 13.5, maxWidth: 640 }}>{sub}</p>}</div>;
}
const Empty = ({ title, children }) => <Card style={{ textAlign: "center", padding: "34px 20px", borderStyle: "dashed" }}><h3 style={{ fontSize: 15, marginBottom: 6 }}>{title}</h3><p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>{children}</p></Card>;
function Logo() {
  return <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="var(--accent)" /><path d="M9 20 L15 8 L18 14 L23 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20" r="2.1" fill="#fff" /><circle cx="15" cy="8" r="2.1" fill="#fff" /><circle cx="23" cy="12" r="2.1" fill="#fff" /></svg>;
}

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

  useEffect(() => { try { const raw = localStorage.getItem("scopewright"); if (raw) { const d = JSON.parse(raw); if (d.session) { setSession(d.session); setStage(d.stage || "requirements"); setCloud(d.cloud || ""); setEstCfg(d.estCfg || DEFAULT_EST); } } } catch (e) {} }, []);
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

/* ---------- landing ---------- */
function Landing({ onStart }) {
  const [tab, setTab] = useState("seed");
  const [text, setText] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  const startSeed = async (sc) => { setBusy(true); const s = await provider.analyze({ scenarioId: sc.id }); onStart(s); };
  const startCustom = async () => { setBusy(true); const s = await provider.analyze({ text, name }); onStart(s); };
  return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "20px 30px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, background: "var(--surface)" }}>
      <Logo /><div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16 }}>Scopewright</div>
      <Chip c="var(--warn)" b="var(--warn-soft)">{provider.label} mode</Chip>
    </div>
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 20px" }}>
      <div style={{ maxWidth: 780, width: "100%" }}>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: "-.03em", maxWidth: 600 }}>Turn raw customer requirements into a traceable solution-scoping package.</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15.5, maxWidth: 600, marginTop: 12 }}>Extract a structured, editable scope model — then generate a PRD, cloud architecture, data &amp; AI strategy, and a reproducible ROM estimate that all trace back to the same reviewed requirements.</p>
        <div style={{ display: "flex", gap: 6, marginTop: 26, marginBottom: 14 }}>
          <Btn kind={tab === "seed" ? "primary" : "ghost"} small onClick={() => setTab("seed")}>Start from a sample</Btn>
          <Btn kind={tab === "custom" ? "primary" : "ghost"} small onClick={() => setTab("custom")}>Paste requirements</Btn>
        </div>
        {tab === "seed" ? <div style={{ display: "grid", gap: 12 }}>
          {SCENARIOS.map(sc => <button key={sc.id} disabled={busy} onClick={() => startSeed(sc)} style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, boxShadow: "var(--shadow)", cursor: "pointer", opacity: busy ? .6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}><span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 15.5 }}>{sc.name}</span><Chip>{sc.tag}</Chip></div>
            <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>{sc.raw.slice(0, 150)}…</p>
            <div style={{ marginTop: 9, display: "flex", gap: 5, flexWrap: "wrap" }}><Chip mono>{sc.requirements.length} requirements</Chip><Chip mono>{sc.openQuestions.length} open questions</Chip>{sc.aiUseCases.length > 0 && <Chip mono>{sc.aiUseCases.length} AI use cases</Chip>}</div>
          </button>)}
        </div> : <Card>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Customer / opportunity name" style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--line-strong)", borderRadius: 8, marginBottom: 10, background: "var(--surface-2)" }} />
          <textarea value={text} onChange={e => setText(e.target.value)} rows={9} placeholder="Paste RFP content, discovery notes, emails or requirements here…" style={{ width: "100%", padding: 11, border: "1px solid var(--line-strong)", borderRadius: 8, resize: "vertical", background: "var(--surface-2)", fontSize: 13.5, lineHeight: 1.55 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <label style={{ fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer" }}><input type="file" accept=".txt,.md" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f); } }} />↑ Upload .txt / .md</label>
            <Btn onClick={startCustom} disabled={busy || text.trim().length < 30}>{busy ? "Analyzing…" : "Analyze requirements →"}</Btn>
          </div>
        </Card>}
        <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 18, maxWidth: 560 }}>Runs in your browser with seeded mock analysis — no paid AI provider required. An internal planning aid, not a quotation or contractual commitment.</p>
      </div>
    </div>
  </div>;
}

/* ---------- requirements ---------- */
function RequirementsStage({ ctx }) {
  const { session, setSession, setStage } = ctx;
  const update = (patch) => setSession({ ...session, ...patch });
  const setReq = (id, patch) => update({ requirements: session.requirements.map(r => r.id === id ? { ...r, ...patch } : r) });
  const delReq = (id) => update({ requirements: session.requirements.filter(r => r.id !== id) });

  const byType = {}; session.requirements.forEach(r => { (byType[r.type] ||= []).push(r); });
  const counts = { stated: session.requirements.filter(r => r.classification === "customer-stated").length, inferred: session.requirements.filter(r => r.classification === "ai-inferred").length, assumed: session.requirements.filter(r => r.classification === "assumed").length };

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
      <SectionTitle sub="Every item keeps a reference to its source text and is classified. Edit priorities, reclassify, exclude, or delete before approving.">Review the extracted scope</SectionTitle>
      <div style={{ display: "flex", gap: 6 }}>
        <Chip c={CLS["customer-stated"].c} b={CLS["customer-stated"].b}>{counts.stated} stated</Chip>
        <Chip c={CLS["ai-inferred"].c} b={CLS["ai-inferred"].b}>{counts.inferred} inferred</Chip>
        <Chip c={CLS.assumed.c} b={CLS.assumed.b}>{counts.assumed} assumed</Chip>
      </div>
    </div>

    {Object.entries(byType).map(([type, rs]) => <div key={type} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", margin: "6px 2px 8px" }}>{type} · {rs.length}</div>
      <div style={{ display: "grid", gap: 8 }}>{rs.map(r => <ReqRow key={r.id} r={r} setReq={setReq} delReq={delReq} />)}</div>
    </div>)}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 4 }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Assumptions requiring review</div>
        {session.assumptions.map(a => <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 9 }}>
          <IdChip id={a.id} /><div style={{ flex: 1 }}><div style={{ fontSize: 12.5 }}>{a.text}</div>
            <select value={a.status} onChange={e => update({ assumptions: session.assumptions.map(x => x.id === a.id ? { ...x, status: e.target.value } : x) })} style={{ marginTop: 4, fontSize: 11, padding: "2px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface-2)" }}>
              <option value="needs-review">needs review</option><option value="confirmed">confirmed</option><option value="proposed">proposed</option></select></div></div>)}
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Clarification questions</div>
        {session.openQuestions.map(q => <div key={q.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={q.resolved} onChange={e => update({ openQuestions: session.openQuestions.map(x => x.id === q.id ? { ...x, resolved: e.target.checked } : x) })} style={{ marginTop: 3 }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, textDecoration: q.resolved ? "line-through" : "none", color: q.resolved ? "var(--ink-faint)" : "var(--ink)" }}><IdChip id={q.id} /> {q.text}</div>
              {q.resolved && <input value={q.answer} onChange={e => update({ openQuestions: session.openQuestions.map(x => x.id === q.id ? { ...x, answer: e.target.value } : x) })} placeholder="Answer / decision…" style={{ marginTop: 4, width: "100%", fontSize: 12, padding: "4px 7px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface-2)" }} />}</div></div>
        </div>)}
      </Card>
    </div>

    <div style={{ position: "sticky", bottom: 0, marginTop: 22, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{session.approved ? <span style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Scope approved — downstream generation unlocked</span> : "Approve the scope to unlock the PRD, architecture, strategy and estimate."}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {session.approved && <Btn kind="ghost" small onClick={() => update({ approved: false })}>Re-open scope</Btn>}
        <Btn onClick={() => { update({ approved: true }); setStage("prd"); }}>{session.approved ? "Continue to PRD →" : "Approve the requirements →"}</Btn>
      </div>
    </div>
  </div>;
}

function ReqRow({ r, setReq, delReq }) {
  const [open, setOpen] = useState(false);
  const cl = CLS[r.classification] || CLS.assumed;
  return <div style={{ border: "1px solid var(--line)", borderRadius: 9, background: r.included === false ? "var(--surface-3)" : "var(--surface)", opacity: r.included === false ? .6 : 1, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
      <IdChip id={r.id} />
      <input value={r.description} onChange={e => setReq(r.id, { description: e.target.value })} style={{ flex: 1, border: "none", background: "none", fontSize: 13.5, color: "var(--ink)", minWidth: 0, outline: "none" }} />
      <Chip c={cl.c} b={cl.b} title="Classification">{cl.label}</Chip>
      <select value={r.priority} onChange={e => setReq(r.id, { priority: e.target.value })} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--line)", color: PRIO[r.priority].c, background: PRIO[r.priority].b }}><option>High</option><option>Medium</option><option>Low</option></select>
      <button onClick={() => setOpen(o => !o)} title="Source & details" style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 7px", fontSize: 11, color: "var(--ink-soft)" }}>{open ? "−" : "source"}</button>
    </div>
    {open && <div style={{ padding: "0 12px 12px", borderTop: "1px dashed var(--line)" }}>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", margin: "8px 0 3px" }}>Source text</div>
      <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--ink-soft)", borderLeft: "3px solid var(--accent-soft)", paddingLeft: 10 }}>“{r.sourceText}”</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Classification&nbsp;<select value={r.classification} onChange={e => setReq(r.id, { classification: e.target.value })} style={{ fontSize: 11.5, padding: "2px 5px", borderRadius: 6, border: "1px solid var(--line)" }}><option value="customer-stated">customer-stated</option><option value="ai-inferred">ai-inferred</option><option value="assumed">assumed</option></select></label>
        {r.dependencies && r.dependencies.length > 0 && <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Depends on {r.dependencies.map(d => <IdChip key={d} id={d} />)}</span>}
        <label style={{ fontSize: 11.5, color: "var(--ink-soft)", marginLeft: "auto" }}><input type="checkbox" checked={r.included !== false} onChange={e => setReq(r.id, { included: e.target.checked })} /> in scope</label>
        <button onClick={() => delReq(r.id)} style={{ fontSize: 11, color: "var(--bad)", background: "none", border: "none" }}>delete</button>
      </div>
    </div>}
  </div>;
}

/* ---------- PRD ---------- */
function PRDStage({ ctx }) {
  const { session, pkg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const { caps, cov } = pkg; const inc = includedReqs(session);
  const group = (t) => inc.filter(r => r.type === t);
  return <div>
    <SectionTitle sub="Generated from the approved scope model. Capabilities reference requirement IDs; the coverage view flags anything not yet organized into scope.">Product requirements &amp; functional scope</SectionTitle>
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

/* ---------- architecture ---------- */
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

/* ---------- strategy ---------- */
function StrategyStage({ ctx }) {
  const { pkg, setStage } = ctx;
  if (!pkg) return <Empty title="Approve the scope first">Return to Requirements and approve the reviewed scope model.</Empty>;
  const { data, integ, ai } = pkg; const [tab, setTab] = useState("data");
  return <div>
    <SectionTitle sub="Coordinated strategy derived from the data, integration and AI requirements in the approved scope.">Data, integration &amp; AI strategy</SectionTitle>
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>{[["data", "Data strategy"], ["integ", "Integration"], ["ai", "AI solution"]].map(([k, l]) => <Btn key={k} small kind={tab === k ? "primary" : "ghost"} onClick={() => setTab(k)}>{l}</Btn>)}</div>

    {tab === "data" && <div style={{ display: "grid", gap: 12 }}>
      <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Data domains</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{data.domains.map(d => <Chip key={d}>{d}</Chip>)}</div><div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-faint)" }}>Traces to {data.reqs.map(id => <IdChip key={id} id={id} />)}</div></Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>{data.points.map(x => <Card key={x.k} pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{x.k}</div><div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{x.v}</div></Card>)}</div>
    </div>}

    {tab === "integ" && <div style={{ display: "grid", gap: 12 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Retrieval &amp; evaluation</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)", marginBottom: 6 }}>{ai.retrieval}</div><div style={{ fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.evaluation}</div></Card>
          <Card pad={13}><div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Responsible AI</div><ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.3, color: "var(--ink-soft)" }}>{ai.responsible.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}</ul></Card>
        </div>
      </> : <Empty title="No AI use cases in scope">This solution is currently deterministic. Add an AI-oriented requirement to generate an AI approach.</Empty>}
    </div>}
    <div style={{ textAlign: "right", marginTop: 16 }}><Btn onClick={() => setStage("estimate")}>Estimate the delivery →</Btn></div>
  </div>;
}

/* ---------- estimate ---------- */
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
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 4, marginTop: 4, fontSize: 14 }}>total … <b style={{ color: "var(--accent-ink)" }}>{est.totalWeeks} person-weeks</b></div>
            <div style={{ marginTop: 6 }}>ROM = {est.totalWeeks} × {money(estCfg.blendedRate)}/wk = <b style={{ color: "var(--ink)" }}>{money(est.cost)}</b></div>
            <div>range (±{Math.round(est.band * 100)}%) = <b style={{ color: "var(--accent-ink)" }}>{money(est.costLow)} – {money(est.costHigh)}</b></div>
          </div></Card>
        <Card><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Delivery phases</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{PHASES.map((p, i) => <div key={p} style={{ flex: "1 1 130px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--accent-ink)" }}>P{i + 1}</div><div style={{ fontSize: 12 }}>{p}</div></div>)}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>~{est.durationWeeks} weeks elapsed with a team of {estCfg.teamSize} (up to 4 parallel workstreams).</div></Card>
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

/* ---------- package ---------- */
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
