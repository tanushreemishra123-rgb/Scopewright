// Session entry (Requirement 1 — ingestion): pick a seed scenario or paste requirements,
// then call the provider to produce the initial, schema-validated scope model.
import React, { useState } from "react";
import { SCENARIOS, ACCEPTED_UPLOAD, extractText } from "../core";
import { provider } from "./provider";
import { Logo, Chip, Btn, Card } from "./primitives";

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
            <label style={{ fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer" }}><input type="file" accept={ACCEPTED_UPLOAD} style={{ display: "none" }} onChange={async e => { const f = e.target.files[0]; if (!f) return; setBusy(true); try { setText(await extractText(f)); } catch (err) { alert("Couldn't read that file automatically — please paste the text instead."); } finally { setBusy(false); } }} />↑ Upload .txt / .md / .pdf / .docx</label>
            <Btn onClick={startCustom} disabled={busy || text.trim().length < 30}>{busy ? "Analyzing…" : "Analyze requirements →"}</Btn>
          </div>
        </Card>}
        <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 18, maxWidth: 560 }}>Runs in your browser with seeded mock analysis — no paid AI provider required. An internal planning aid, not a quotation or contractual commitment.</p>
      </div>
    </div>
  </div>;
}

export default Landing;
