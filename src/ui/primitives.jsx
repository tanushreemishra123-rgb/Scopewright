// Shared presentational primitives and design tokens for the workspace UI.
// Kept in one module so every stage renders consistently and stays DRY: a single
// source of chip/button/card styling and the requirement-classification palette.
import React from "react";

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

export { CLS, PRIO, Chip, IdChip, Btn, Card, SectionTitle, Empty, Logo };
