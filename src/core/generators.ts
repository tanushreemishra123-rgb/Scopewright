import type { Session, Requirement, Capability, Architecture, ArchComponent, Cloud, Priority } from "./types";
import { SERVICE_MAP } from "./cloudMap";

export function includedReqs(s: Session): Requirement[] {
  return s.requirements.filter(r => r.included !== false);
}
const PW = { High: 0, Medium: 1, Low: 2 } as const;

/** Group requirements into capabilities by logical module. */
export function buildCapabilities(s: Session): Capability[] {
  const groups: Record<string, Requirement[]> = {};
  includedReqs(s).forEach(r => { (groups[r.module || r.type] ||= []).push(r); });
  return Object.entries(groups).map(([name, rs]) => {
    const reqs = rs.map(r => r.id);
    const idSet = new Set(reqs);
    // external dependencies = requirement dependencies that point outside this capability
    const dependencies = [...new Set(rs.flatMap(r => r.dependencies || []))].filter(d => !idSet.has(d));
    return {
      name, reqs, dependencies,
      priority: (rs.some(r => r.priority === "High") ? "High" : rs.some(r => r.priority === "Medium") ? "Medium" : "Low") as Priority,
      scope: `Deliver ${name.toLowerCase()} covering: ${rs.map(r => r.description.replace(/\.$/, "")).slice(0, 3).join("; ")}${rs.length > 3 ? "; …" : "."}`,
      complexity: (rs.length >= 4 ? "High" : rs.length >= 2 ? "Medium" : "Low") as Priority,
    };
  }).sort((a, b) => PW[a.priority] - PW[b.priority]);
}

/** Cloud-specific architecture; every functional component references the reqs that justify it. */
export function buildArchitecture(s: Session, cloud: Cloud): Architecture {
  const rs = includedReqs(s);
  const has = (t: string) => rs.some(r => r.type === t);
  const reqsOf = (pred: (r: Requirement) => boolean) => rs.filter(pred).map(r => r.id);
  const comps: ArchComponent[] = [];
  const add = (key: string, name: string, purpose: string, rationale: string, reqIds: string[], tradeoff: string, sec: string) =>
    comps.push({ key, name, service: SERVICE_MAP[key][cloud], purpose, rationale, reqIds, tradeoff, sec, deps: [] });

  add("web", "User-facing web app", "Front-end for associates/agents/analysts.",
    "Requirements call for browser-based apps; managed static hosting removes ops overhead.",
    reqsOf(r => r.type === "Functional"), "Static hosting needs a separate API tier for dynamic data.", "HTTPS + WAF at the edge.");
  add("api", "Application API tier", "Business logic and orchestration behind the UI.",
    "Container platform gives scalable, portable services for the functional scope.",
    reqsOf(r => r.type === "Functional" || r.type === "Business"), "Containers add build/runtime complexity vs. pure serverless.", "AuthN/Z on every route.");
  if (has("Data")) add("rdb", "Transactional database", "Primary system-of-record store.",
    "Managed PostgreSQL provides ACID, encryption, automated backups and regional residency.",
    reqsOf(r => r.type === "Data"), "Vertical scaling limits; may need read replicas at peak.", "Encryption at rest via KMS; residency pinned to region.");
  if (has("Data") || (s.aiUseCases && s.aiUseCases.length)) add("storage", "Object storage", "Store documents, exports, model artefacts and large blobs.",
    "Requirements involve files/large objects and analytical/backup data better held outside the transactional store.",
    reqsOf(r => r.type === "Data"), "Eventual consistency; lifecycle policies to manage.", "Encryption at rest + bucket-level access policies.");
  const peak = rs.some(r => /peak|500,000|scale|concurren/i.test(r.description));
  if (peak) {
    add("cache", "Caching / read acceleration", "Absorb read spikes and cut DB load at peak.",
      "Peak-load NFRs require a cache to protect the database during traffic surges.",
      reqsOf(r => r.type === "Non-functional"), "Cache invalidation complexity.", "Encrypted in transit.");
    add("events", "Event / queue backbone", "Decouple order processing and integration bursts.",
      "Near-real-time sync + peak bursts need asynchronous buffering.",
      reqsOf(r => r.type === "Integration" || r.type === "Non-functional"), "Eventual-consistency semantics to design for.", "Message-level access control.");
  }
  if (has("Integration")) add("integ", "Integration / orchestration layer", "Connect ERP/CRM/third-party systems.",
    "Multiple external systems need managed connectors, retries and orchestration.",
    reqsOf(r => r.type === "Integration"), "Vendor API limits constrain throughput.", "Secrets in managed vault; least-privilege service identities.");
  if (s.aiUseCases && s.aiUseCases.length) {
    const aiReqs = [...new Set(s.aiUseCases.flatMap(u => u.reqs))];
    add("ai", "AI / LLM service", "Host generative and reasoning workloads.",
      "AI use cases require a governed managed model service with content controls.",
      aiReqs, "Token cost and latency to manage.", "Prompt/response logging; PII handling policy.");
    add("vector", "Retrieval index", "Ground AI answers in enterprise data.",
      "RAG patterns need a vector store for grounded, cited responses.",
      aiReqs, "Index freshness vs. cost trade-off.", "Access-scoped retrieval.");
  }
  add("identity", "Identity & access", "Authentication, SSO and role-based access.",
    "SSO / RBAC requirements and enterprise login drive a managed identity service.",
    reqsOf(r => r.type === "Security" || /sso|login|access/i.test(r.description)), "Federation setup effort with corporate IdP.", "MFA + conditional access.");
  add("obs", "Observability", "Metrics, logs, traces and alerting.",
    "Operability and SLAs require end-to-end telemetry.", [], "Log volume cost.", "Audit-grade log retention.");
  add("security", "Security controls", "Key management, WAF and secrets.",
    "Compliance/audit requirements mandate managed crypto and edge protection.",
    reqsOf(r => r.type === "Security"), "Policy overhead.", "Central to compliance posture.");
  if (has("Data")) add("backup", "Backup & disaster recovery", "Automated backups, retention and cross-region recovery.",
    "Availability/retention requirements need point-in-time recovery and a DR target.",
    reqsOf(r => r.type === "Data" || r.type === "Non-functional"), "Cross-region cost; RPO/RTO to agree.", "Immutable, encrypted backups; tested restores.");
  add("cicd", "CI/CD & environments", "Build, test and promote across dev/test/prod.",
    "Repeatable delivery across environments needs automated pipelines.", [], "Pipeline maintenance.", "Signed artifacts; environment isolation.");

  // Post-process: component-to-component dependencies (shown as component names, only when present).
  const DEP_MAP: Record<string, string[]> = {
    web: ["api", "identity"], api: ["rdb", "identity", "events", "integ"], rdb: ["security"],
    storage: ["security"], cache: ["rdb"], events: ["security"], integ: ["events", "security"],
    ai: ["vector", "integ", "security"], vector: ["storage"], backup: ["rdb", "storage"],
    obs: [], security: [], identity: [], cicd: [],
  };
  const nameOf: Record<string, string> = Object.fromEntries(comps.map(c => [c.key, c.name]));
  comps.forEach(c => { c.deps = (DEP_MAP[c.key] || []).filter(k => nameOf[k] && k !== c.key).map(k => nameOf[k]); });
  return { cloud, components: comps };
}

export function buildDataStrategy(s: Session) {
  const dataReqs = includedReqs(s).filter(r => r.type === "Data");
  const anyMatch = (re: RegExp) => dataReqs.some(r => re.test(r.description));
  return {
    domains: [...new Set(dataReqs.map(r => r.module))].concat(dataReqs.length ? [] : ["(no explicit data domains)"]),
    points: [
      { k: "Sources & ownership", v: "Systems of record identified from integration requirements; ownership confirmed per domain during discovery." },
      { k: "Ingestion", v: anyMatch(/real-?time|stream|near/i) ? "Mixed: streaming for real-time feeds + batch for bulk/historical loads." : "Batch ingestion with scheduled loads." },
      { k: "Storage", v: "Transactional store for operational data; analytical/reporting store separated to protect OLTP performance." },
      { k: "Quality & governance", v: anyMatch(/lineage|quality|governance/i) ? "Automated data-quality checks and lineage capture required by regulator-facing requirements." : "Baseline validation on ingest; governance to be expanded." },
      { k: "Retention & privacy", v: s.requirements.some(r => /retention|gdpr|hipaa|pii|residency|eu/i.test(r.description)) ? "Retention windows and PII handling enforced per stated compliance requirements." : "Standard retention; confirm compliance scope." },
      { k: "Backup & recovery", v: "Automated backups with point-in-time recovery; DR target defined by availability NFRs." },
    ],
    reqs: dataReqs.map(r => r.id),
  };
}

export function buildIntegration(s: Session) {
  const ints = includedReqs(s).filter(r => r.type === "Integration");
  return {
    items: ints.map(r => ({
      id: r.id, name: r.description.replace(/\.$/, ""),
      mode: /real-?time|stream|near/i.test(r.description) ? "Event / near-real-time" : /batch|nightly/i.test(r.description) ? "Batch" : "API (request/response)",
      systems: (r.description.match(/SAP|Salesforce|Zendesk|Power BI|ERP|CRM|billing|intake API/gi) || ["External system"]).join(", "),
    })),
    concerns: [
      { k: "Authentication", v: "OAuth2 / service credentials stored in managed secrets; least-privilege scopes." },
      { k: "Error handling & retry", v: "Idempotent operations with exponential backoff, dead-letter queues and reconciliation." },
      { k: "Monitoring", v: "Per-integration health metrics, latency and failure alerting." },
      { k: "Synchronization", v: "Change-data-capture or event-driven updates where near-real-time is required." },
    ],
    reqs: ints.map(r => r.id),
  };
}

export function buildAI(s: Session) {
  const cases = s.aiUseCases || [];
  const heavy = cases.length >= 2;
  return {
    cases,
    framework: heavy
      ? { name: "LangGraph (orchestration) + managed cloud LLM", why: "Multiple AI use cases with routing, tool calls and human-in-the-loop escalation benefit from an explicit stateful graph; the managed cloud model keeps data in-region and avoids paid-key lock-in for the assistant itself." }
      : { name: "Vercel AI SDK + managed cloud LLM", why: "A single, well-bounded generation use case is served well by a lightweight SDK with structured output; heavier orchestration is unwarranted." },
    retrieval: cases.some(u => /rag|retriev|knowledge|citation/i.test(u.pattern)) ? "Vector retrieval over governed enterprise data with citation of sources." : "Not required for the current use cases.",
    evaluation: "Offline eval set with accuracy/groundedness metrics; block launch until thresholds met; ongoing sampling in production.",
    responsible: [
      "Human review required on customer-facing output.",
      "Deterministic facts (order status, account data, eligibility) fetched from systems of record — never generated.",
      "PII handling and prompt/response logging with retention limits.",
      "Confidence scoring with safe escalation to humans on low confidence or sensitive topics.",
    ],
    reqs: [...new Set(cases.flatMap(u => u.reqs))],
  };
}

/** PRD extras derived from the scope model: dependencies, out-of-scope, recommended enhancements. */
export function buildPRDExtras(s: Session) {
  const inc = includedReqs(s);
  const dependencies = inc
    .filter(r => r.dependencies && r.dependencies.length)
    .map(r => ({ from: r.id, to: r.dependencies }));
  const excluded = s.requirements.filter(r => r.included === false);
  const outOfScope = [
    ...excluded.map(r => `${r.id} — ${r.description} (excluded from scope)`),
    ...s.assumptions.filter(a => /out of scope|remains in the existing|stays in the existing/i.test(a.text)).map(a => `${a.id} — ${a.text}`),
  ];
  const enhancements = inc.filter(r => r.classification === "ai-inferred");
  const toConfirm = inc.filter(r => r.classification === "assumed");
  return { dependencies, outOfScope, enhancements, toConfirm };
}

/** Risks: use the reviewed risk model, or derive a minimal set from open questions. */
export function buildRisks(s: Session) {
  if (s.risks && s.risks.length) return s.risks;
  return (s.openQuestions || []).slice(0, 3).map((q, i) => ({
    id: `RISK_${String(i + 1).padStart(2, "0")}`,
    description: `Unresolved: ${q.text}`,
    severity: "Medium" as const, category: "Delivery" as const,
    mitigation: "Resolve during discovery before committing scope/estimate.", reqs: [] as string[],
  }));
}
