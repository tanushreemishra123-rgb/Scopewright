// Stage 1 — Understand the need. Review/edit the structured, source-traceable scope model
// (classification, priority, in/out of scope) and approve it before any downstream
// generation. Renders the grounding-hierarchy legend. Requirement 1.
import React, { useState } from "react";
import { CLS, PRIO, Chip, IdChip, Btn, Card, SectionTitle } from "./primitives";

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

    <Card pad={13} style={{ marginBottom: 16, background: "var(--surface-2)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 8 }}>Grounding hierarchy — every output traces to one of these labeled layers</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, fontSize: 12 }}>
        <div style={{ display: "flex", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--stated)", marginTop: 3, flexShrink: 0 }} /><div><b>1 · Customer-stated</b><div style={{ color: "var(--ink-soft)" }}>Directly from the customer's text (primary source; keeps its source reference).</div></div></div>
        <div style={{ display: "flex", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)", marginTop: 3, flexShrink: 0 }} /><div><b>2 · Reviewed assumptions &amp; config</b><div style={{ color: "var(--ink-soft)" }}>User-set and status-tracked; unreviewed items reduce estimate confidence.</div></div></div>
        <div style={{ display: "flex", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--inferred)", marginTop: 3, flexShrink: 0 }} /><div><b>3 · AI-inferred / Assumed</b><div style={{ color: "var(--ink-soft)" }}>AI recommendations, clearly labeled; gaps become clarification questions, not silent facts.</div></div></div>
      </div>
    </Card>

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
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Clarify missing information</div>
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

export default RequirementsStage;
