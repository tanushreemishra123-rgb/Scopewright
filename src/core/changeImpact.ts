import type { Session, EstimateConfig, Cloud } from "./types";

export type ChangeType = "users" | "cloud" | "contingency" | "priority" | "scope" | "security" | "integration" | "rate" | "deadline";
export interface ImpactResult {
  session: Session;
  cfg: EstimateConfig;
  cloud: Cloud | "";
  impact: { desc: string; affected: string[]; unaffected: string[]; type: ChangeType };
}

const CLOUD_ORDER: Cloud[] = ["aws", "azure", "gcp"];

/**
 * Apply a change and report exactly which outputs are affected vs. preserved.
 * Returns a NEW model — reviewed, unaffected content is not mutated in place.
 */
export function computeChangeImpact(session: Session, cfg: EstimateConfig, cloud: Cloud | "", type: ChangeType): ImpactResult {
  let s = session, c = cfg, cl: Cloud | "" = cloud;
  let desc = "", affected: string[] = [], unaffected: string[] = [];

  switch (type) {
    case "users": {
      desc = "Expected user volume increased 10×.";
      c = { ...cfg, contingency: Math.min(40, cfg.contingency + 5), cloudComplexity: "High" };
      // reference the real scalability requirement IDs in scope, and raise their priority
      const scaleReqs = session.requirements.filter(r => r.included !== false && (r.type === "Non-functional" || /scale|peak|concurren|volume|throughput|latenc/i.test(r.description)));
      s = { ...session, requirements: session.requirements.map(r => scaleReqs.some(x => x.id === r.id) ? { ...r, priority: "High" } : r) };
      const ids = scaleReqs.map(r => r.id).join(", ") || "scalability NFRs";
      affected = [`${ids}`, "Scalability architecture", "Caching strategy", "Database sizing", "Performance testing", "Cloud cost assumptions", "Delivery effort", "ROM estimate"];
      unaffected = ["Customer personas", "Core workflows", "Existing integrations", "Data domains"];
      break;
    }
    case "cloud": {
      const next = CLOUD_ORDER[(CLOUD_ORDER.indexOf(cloud as Cloud) + 1) % 3] || "aws";
      cl = next;
      s = { ...session, context: { ...session.context, cloud: next } };
      desc = `Cloud platform changed to ${next.toUpperCase()}.`;
      affected = ["Solution architecture (all services re-mapped)", "Cloud cost assumptions", "Deployment approach"];
      unaffected = ["Requirements", "Functional scope", "Data domains", "AI use cases", "Effort in person-weeks"];
      break;
    }
    case "contingency": {
      desc = "Contingency raised to 30%.";
      c = { ...cfg, contingency: 30 };
      affected = ["ROM estimate", "Total person-weeks"];
      unaffected = ["Scope", "Architecture", "Data & AI strategy", "Requirement coverage", "Base effort"];
      break;
    }
    case "priority": {
      const fr = session.requirements.find(r => r.type === "Functional" && r.priority !== "High" && r.included !== false);
      if (fr) {
        s = { ...session, requirements: session.requirements.map(r => r.id === fr.id ? { ...r, priority: "High" } : r) };
        desc = `${fr.id} raised to High priority.`;
        affected = [`Capability containing ${fr.id}`, "Quality gate (high-priority coverage)"];
        unaffected = ["Other requirements", "Architecture services", "ROM total"];
      } else desc = "No non-high functional requirement available to escalate.";
      break;
    }
    case "scope": {
      const low = [...session.requirements].reverse().find(r => r.priority === "Low" && r.included !== false);
      if (low) {
        s = { ...session, requirements: session.requirements.map(r => r.id === low.id ? { ...r, included: false } : r) };
        desc = `${low.id} removed from scope.`;
        affected = [`Capabilities referencing ${low.id}`, "Requirement coverage", "Effort estimate"];
        unaffected = ["High-priority scope", "Architecture core", "Personas"];
      } else desc = "No low-priority requirement available to remove.";
      break;
    }
    case "security": {
      const sec = session.requirements.find(r => r.type === "Security" && r.included !== false);
      if (sec) {
        s = { ...session, requirements: session.requirements.map(r => r.id === sec.id ? { ...r, priority: "High" } : r) };
        desc = `Security requirement ${sec.id} raised to High.`;
        affected = [`${sec.id}`, "Identity & security architecture", "Security uplift in effort", "Compliance quality-gate checks", "ROM estimate"];
        unaffected = ["Customer personas", "Core workflows", "Data domains", "AI use cases"];
      } else desc = "No security requirement in scope to escalate.";
      break;
    }
    case "integration": {
      const intg = session.requirements.find(r => r.type === "Integration" && r.priority !== "High" && r.included !== false)
        || session.requirements.find(r => r.type === "Integration" && r.included !== false);
      if (intg) {
        s = { ...session, requirements: session.requirements.map(r => r.id === intg.id ? { ...r, priority: "High" } : r) };
        desc = `Integration ${intg.id} complexity raised (High).`;
        affected = [`${intg.id}`, "Integration architecture", "Integration workstream effort", "Delivery timeline", "ROM estimate"];
        unaffected = ["Personas", "Functional scope (non-integration)", "Data domains"];
      } else desc = "No integration requirement in scope to change.";
      break;
    }
    case "rate": {
      const newRate = Math.round(cfg.blendedRate * 1.15);
      c = { ...cfg, blendedRate: newRate };
      desc = `Rate card increased 15% to ${cfg.currency} ${newRate.toLocaleString()}/wk.`;
      affected = ["ROM commercials", "Role-based cost breakdown"];
      unaffected = ["Effort in person-weeks", "Scope", "Architecture", "Timeline", "Requirement coverage"];
      break;
    }
    case "deadline": {
      const newTeam = Math.min(14, cfg.teamSize + 3);
      c = { ...cfg, teamSize: newTeam };
      desc = `Delivery deadline tightened — team grown to ${newTeam} for more parallelism.`;
      affected = ["Delivery timeline (compressed)", "Team composition", "Delivery risk (coordination)"];
      unaffected = ["Effort in person-weeks", "ROM total", "Scope", "Architecture", "Requirement coverage"];
      break;
    }
  }
  return { session: s, cfg: c, cloud: cl, impact: { desc, affected, unaffected, type } };
}
