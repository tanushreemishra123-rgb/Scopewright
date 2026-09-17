import type { Session } from "../core/types";
import { SCENARIOS } from "../core/scenarios";
import { heuristicAnalyze } from "../core/analyze";
import { validateAnalysis } from "../core/schema";

export interface AnalyzeInput { scenarioId?: string; name?: string; text?: string; }
export interface Provider { id: string; label: string; analyze(input: AnalyzeInput): Promise<Session>; }

const uid = (p: string) => p + "_" + Math.random().toString(36).slice(2, 7);

function sessionFromScenario(id: string): Session {
  const sc = SCENARIOS.find(s => s.id === id);
  if (!sc) throw new Error(`unknown scenario ${id}`);
  const clone: Session = JSON.parse(JSON.stringify(sc));
  clone.requirements.forEach(r => { r.included = true; });
  return clone;
}

function sessionFromText(text: string, name?: string): Session {
  const res = heuristicAnalyze(text);
  const v = validateAnalysis(res);
  if (!v.ok) console.warn("[provider] analysis validation issues:", v.issues);
  return {
    id: uid("cust"), tag: "Custom input", name: name || "Custom scoping session",
    context: { customer: name || "Customer", opportunity: "Provided requirements", regions: "", users: "", deadline: "", cloud: "" },
    raw: text,
    requirements: res.requirements.map(r => ({ ...r, included: true })),
    assumptions: res.assumptions, openQuestions: res.openQuestions, aiUseCases: res.aiUseCases,
  };
}

/** Mock provider — deterministic, no network, no paid AI. Always available. */
export const mockProvider: Provider = {
  id: "mock", label: "Mock AI",
  async analyze(input) {
    await new Promise(r => setTimeout(r, 350));
    if (input.scenarioId) return sessionFromScenario(input.scenarioId);
    return sessionFromText(input.text || "", input.name);
  },
};

/**
 * Optional real provider. Calls an OpenAI-compatible chat endpoint configured via env:
 *   VITE_AI_BASE_URL, VITE_AI_API_KEY, VITE_AI_MODEL
 * The structured JSON it returns is schema-validated; on any failure it falls back to mock.
 * Kept behind env so the app never REQUIRES paid access.
 */
export const realProvider: Provider = {
  id: "live", label: "Live AI",
  async analyze(input) {
    const env: any = (import.meta as any).env || {};
    const base = env.VITE_AI_BASE_URL, key = env.VITE_AI_API_KEY, model = env.VITE_AI_MODEL || "gpt-4o-mini";
    if (!base || !key) return mockProvider.analyze(input);
    if (input.scenarioId) return sessionFromScenario(input.scenarioId); // seeds stay deterministic
    try {
      const sys = "Extract requirements as strict JSON: {requirements:[{id,type,priority,classification,module,description,sourceText,dependencies}],assumptions:[{id,text,status}],openQuestions:[{id,text}],aiUseCases:[]}. IDs like FR_01. No prose.";
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sys }, { role: "user", content: input.text }], temperature: 0 }),
      });
      const data = await res.json();
      const parsed = JSON.parse((data.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, ""));
      const v = validateAnalysis(parsed);
      if (!v.ok) { console.warn("[live] invalid structured output, falling back to mock:", v.issues); return mockProvider.analyze(input); }
      return {
        id: uid("live"), tag: "Live AI", name: input.name || "Live scoping session",
        context: { customer: input.name || "Customer", opportunity: "Provided requirements", cloud: "" },
        raw: input.text || "",
        requirements: parsed.requirements.map((r: any) => ({ ...r, included: true })),
        assumptions: parsed.assumptions || [], openQuestions: (parsed.openQuestions || []).map((q: any) => ({ ...q, resolved: false, answer: "" })),
        aiUseCases: parsed.aiUseCases || [],
      };
    } catch (e) {
      console.warn("[live] request failed, falling back to mock:", e);
      return mockProvider.analyze(input);
    }
  },
};

export function getProvider(): Provider {
  const env: any = (import.meta as any).env || {};
  return env.VITE_AI_BASE_URL && env.VITE_AI_API_KEY ? realProvider : mockProvider;
}
