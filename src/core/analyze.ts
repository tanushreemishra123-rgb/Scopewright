import type { Requirement, ReqType, Priority, Assumption, OpenQuestion, AiUseCase } from "./types";

export interface AnalysisResult {
  requirements: Requirement[];
  assumptions: Assumption[];
  openQuestions: OpenQuestion[];
  aiUseCases: AiUseCase[];
}

const PREFIX: Record<ReqType, string> = {
  Functional:"FR", Integration:"INT", Data:"DATA", "Non-functional":"NFR", Security:"SEC", Business:"BR",
};

function classifyType(l: string): ReqType {
  const s = l.toLowerCase();
  if (/integrat|api|sync|connect|erp|crm|zendesk|salesforce|sap/.test(s)) return "Integration";
  if (/data|store|database|migrat|retention|ingest|report|analytic/.test(s)) return "Data";
  if (/secur|gdpr|hipaa|compliance|audit|sso|encrypt|pii|mask/.test(s)) return "Security";
  if (/scale|latenc|performance|availab|uptime|throughput|peak|concurren/.test(s)) return "Non-functional";
  if (/replace|platform|business|goal|objective|want a|need a modern/.test(s)) return "Business";
  return "Functional";
}
function classifyPriority(l: string): Priority {
  const s = l.toLowerCase();
  if (/must|mandatory|critical|required|cannot/.test(s)) return "High";
  if (/should|near-real|important/.test(s)) return "Medium";
  return "Low";
}

/** Lightweight, deterministic extractor for arbitrary pasted requirements text. */
export function heuristicAnalyze(text: string): AnalysisResult {
  const lines = text.split(/\n|(?<=[.;])\s+/).map(s => s.trim()).filter(s => s.length > 18);
  const reqs: Requirement[] = [];
  const counters: Record<ReqType, number> = { Functional:0, Integration:0, Data:0, "Non-functional":0, Security:0, Business:0 };
  lines.slice(0, 16).forEach(l => {
    const type = classifyType(l); counters[type]++;
    reqs.push({
      id: `${PREFIX[type]}_${String(counters[type]).padStart(2, "0")}`,
      type, priority: classifyPriority(l), classification: "ai-inferred", module: type,
      description: l.replace(/\s+/g, " ").slice(0, 180), sourceText: l.slice(0, 180),
      dependencies: [], included: true,
    });
  });
  const t = text.toLowerCase();
  const openQuestions: OpenQuestion[] = [];
  if (!/rate|budget|cost/.test(t)) openQuestions.push({ id:"OQ_01", text:"What is the target budget or rate card for this engagement?", resolved:false, answer:"" });
  if (!/deadline|month|timeline|go-live/.test(t)) openQuestions.push({ id:"OQ_02", text:"What is the required delivery timeline?", resolved:false, answer:"" });
  if (reqs.filter(r => r.type === "Non-functional").length === 0) openQuestions.push({ id:"OQ_03", text:"What are the expected user volumes and performance targets?", resolved:false, answer:"" });

  return {
    requirements: reqs.length ? reqs : [{ id:"BR_01", type:"Business", priority:"Medium", classification:"ai-inferred", module:"Platform", description: text.slice(0,160) || "No parseable requirements found.", sourceText: text.slice(0,160), dependencies:[], included:true }],
    assumptions: [{ id:"ASM_01", text:"Requirements were auto-extracted heuristically and need reviewer confirmation.", status:"needs-review" }],
    openQuestions,
    aiUseCases: /\bai\b|assistant|llm|model|chatbot|generat/.test(t)
      ? [{ id:"AIU_01", title:"AI capability (inferred from text)", reqs: reqs.filter(r => r.type === "Functional").slice(0,2).map(r => r.id), pattern:"To be defined during discovery", human:"Human review recommended", deterministic:"Separate deterministic rules from generative steps." }]
      : [],
  };
}
