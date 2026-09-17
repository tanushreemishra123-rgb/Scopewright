import type { Session } from "./types";

// Seed scenarios. Customer requirements are the PRIMARY source.
// Covers: application modernization, data/integration-heavy, AI-enabled,
// and a scenario with important missing information.
export const SCENARIOS: Session[] = [
{
  id: "orion", tag: "Application modernization · AI · Integrations",
  name: "Orion Retail — Order Management Modernization",
  context: { customer: "Orion Retail Group", opportunity: "Replace legacy order-management with a cloud platform and AI assist",
    regions: "EU (primary), UK", users: "~40,000 store + call-centre users", deadline: "Go-live in 7 months", cloud: "" },
  raw: `Orion Retail runs a 12-year-old on-prem order management system that is slow and hard to change. They want a modern, cloud-based platform for store associates and call-centre agents.

Store associates need a fast web app to create and track orders. Orders must sync with the existing SAP ERP and the Salesforce CRM in near real time. The system must handle Black Friday peaks (up to 500,000 orders/day) without degradation.

They want an AI assistant that helps agents answer "where is my order" questions using order and shipment data, and that drafts customer email replies for agent approval. All AI outputs shown to customers must be reviewed by an agent.

Data must stay in the EU. The platform must support SSO with the corporate Entra ID. They mentioned GDPR compliance and audit logging are mandatory. They are unsure whether returns processing is in scope for phase 1. Payment processing stays in the existing system.`,
  requirements: [
    { id:"BR_01", type:"Business", priority:"High", classification:"customer-stated", module:"Platform", description:"Replace the legacy on-prem order-management system with a cloud-based platform.", sourceText:"They want a modern, cloud-based platform for store associates and call-centre agents.", dependencies:[] },
    { id:"FR_01", type:"Functional", priority:"High", classification:"customer-stated", module:"Order Management", description:"Web app for associates to create and track orders quickly.", sourceText:"Store associates need a fast web app to create and track orders.", dependencies:["NFR_01"] },
    { id:"FR_02", type:"Functional", priority:"High", classification:"customer-stated", module:"AI Assist", description:"AI assistant answers 'where is my order' using order + shipment data.", sourceText:"an AI assistant that helps agents answer \"where is my order\" questions", dependencies:["DATA_01","INT_01"] },
    { id:"FR_03", type:"Functional", priority:"Medium", classification:"customer-stated", module:"AI Assist", description:"AI drafts customer email replies for agent approval before sending.", sourceText:"drafts customer email replies for agent approval", dependencies:["SEC_02"] },
    { id:"FR_04", type:"Functional", priority:"Low", classification:"assumed", module:"Returns", description:"Returns processing workflow (scope unconfirmed for phase 1).", sourceText:"They are unsure whether returns processing is in scope for phase 1.", dependencies:[], openQuestion:"OQ_01" },
    { id:"INT_01", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Near-real-time order sync with SAP ERP.", sourceText:"Orders must sync with the existing SAP ERP ... in near real time.", dependencies:[] },
    { id:"INT_02", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Order/customer sync with Salesforce CRM.", sourceText:"and the Salesforce CRM in near real time.", dependencies:[] },
    { id:"DATA_01", type:"Data", priority:"High", classification:"customer-stated", module:"Data", description:"Store order and shipment data with EU residency.", sourceText:"Data must stay in the EU.", dependencies:["SEC_01"] },
    { id:"NFR_01", type:"Non-functional", priority:"High", classification:"customer-stated", module:"Platform", description:"Scale to Black Friday peak of ~500,000 orders/day without degradation.", sourceText:"handle Black Friday peaks (up to 500,000 orders/day) without degradation.", dependencies:[] },
    { id:"NFR_02", type:"Non-functional", priority:"Medium", classification:"ai-inferred", module:"Platform", description:"Low-latency order creation (<1s) for associate productivity.", sourceText:"Store associates need a fast web app (performance implied).", dependencies:[] },
    { id:"SEC_01", type:"Security", priority:"High", classification:"customer-stated", module:"Security", description:"GDPR compliance and comprehensive audit logging.", sourceText:"GDPR compliance and audit logging are mandatory.", dependencies:[] },
    { id:"SEC_02", type:"Security", priority:"High", classification:"customer-stated", module:"Security", description:"SSO with corporate Microsoft Entra ID; human review of customer-facing AI output.", sourceText:"support SSO with the corporate Entra ID ... reviewed by an agent.", dependencies:[] },
  ],
  assumptions: [
    { id:"ASM_01", text:"Payment processing remains in the existing system and is out of scope.", status:"confirmed" },
    { id:"ASM_02", text:"SAP and Salesforce expose usable APIs for near-real-time sync.", status:"needs-review" },
    { id:"ASM_03", text:"Peak concurrency is ~3,000 simultaneous users during Black Friday.", status:"needs-review" },
  ],
  openQuestions: [
    { id:"OQ_01", text:"Is returns processing in scope for phase 1?", resolved:false, answer:"" },
    { id:"OQ_02", text:"What are the SLAs / API rate limits for the SAP ERP integration?", resolved:false, answer:"" },
    { id:"OQ_03", text:"Which email provider must the AI drafting integrate with?", resolved:false, answer:"" },
  ],
  aiUseCases: [
    { id:"AIU_01", title:"Order-status Q&A assistant", reqs:["FR_02","DATA_01"], pattern:"RAG over order/shipment data", human:"Suggested answer, agent sends", deterministic:"Exact status lookups use direct DB queries, not the model." },
    { id:"AIU_02", title:"Customer email drafting", reqs:["FR_03","SEC_02"], pattern:"Guided generation with templates", human:"Mandatory agent approval before send", deterministic:"Order facts injected from system of record." },
  ],
},
{
  id: "meridian", tag: "Data & integration-heavy",
  name: "Meridian Insurance — Unified Claims Data Platform",
  context: { customer:"Meridian Insurance", opportunity:"Consolidate claims data from 6 systems into a governed platform", regions:"US", users:"~2,500 analysts & adjusters", deadline:"9 months", cloud:"" },
  raw: `Meridian has claims data spread across six legacy systems with inconsistent formats. They want a unified, governed data platform for analytics and reporting.

They need batch ingestion from all six systems nightly, plus a near-real-time feed from the new claims intake API. Data quality and lineage are critical for regulators. Analysts need dashboards and self-service reporting. PII must be masked for most users.

They already use Power BI and want to keep it. Historical data (10 years) must be migrated. Retention policy is 7 years for closed claims.`,
  requirements: [
    { id:"BR_01", type:"Business", priority:"High", classification:"customer-stated", module:"Platform", description:"Unified, governed data platform for claims analytics and reporting.", sourceText:"unified, governed data platform for analytics and reporting.", dependencies:[] },
    { id:"DATA_01", type:"Data", priority:"High", classification:"customer-stated", module:"Data", description:"Nightly batch ingestion from six legacy claims systems.", sourceText:"batch ingestion from all six systems nightly", dependencies:["INT_01"] },
    { id:"DATA_02", type:"Data", priority:"High", classification:"customer-stated", module:"Data", description:"Near-real-time feed from the new claims intake API.", sourceText:"near-real-time feed from the new claims intake API.", dependencies:["INT_02"] },
    { id:"DATA_03", type:"Data", priority:"High", classification:"customer-stated", module:"Governance", description:"Data quality checks and end-to-end lineage for regulators.", sourceText:"Data quality and lineage are critical for regulators.", dependencies:[] },
    { id:"DATA_04", type:"Data", priority:"Medium", classification:"customer-stated", module:"Data", description:"Migrate 10 years of historical claims data; 7-year retention for closed claims.", sourceText:"Historical data (10 years) must be migrated. Retention policy is 7 years", dependencies:[] },
    { id:"FR_01", type:"Functional", priority:"High", classification:"customer-stated", module:"Analytics", description:"Dashboards and self-service reporting for analysts (Power BI retained).", sourceText:"Analysts need dashboards and self-service reporting ... keep Power BI.", dependencies:["INT_03"] },
    { id:"INT_01", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Batch connectors to six legacy systems.", sourceText:"batch ingestion from all six systems", dependencies:[] },
    { id:"INT_02", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Streaming connector to claims intake API.", sourceText:"near-real-time feed from the new claims intake API", dependencies:[] },
    { id:"INT_03", type:"Integration", priority:"Medium", classification:"customer-stated", module:"Integration", description:"Power BI connectivity to the platform's semantic layer.", sourceText:"keep Power BI", dependencies:[] },
    { id:"SEC_01", type:"Security", priority:"High", classification:"customer-stated", module:"Security", description:"PII masking / row-level security for most users.", sourceText:"PII must be masked for most users.", dependencies:[] },
    { id:"NFR_01", type:"Non-functional", priority:"Medium", classification:"ai-inferred", module:"Platform", description:"Nightly pipeline must complete within batch window (assumed 4h).", sourceText:"batch ingestion ... nightly (window implied)", dependencies:[] },
  ],
  assumptions: [
    { id:"ASM_01", text:"Six source systems can provide nightly extracts or DB read access.", status:"needs-review" },
    { id:"ASM_02", text:"Batch window is approximately 4 hours overnight.", status:"needs-review" },
  ],
  openQuestions: [
    { id:"OQ_01", text:"What are the record volumes per source system?", resolved:false, answer:"" },
    { id:"OQ_02", text:"Are there regulator-specified lineage/audit standards to meet?", resolved:false, answer:"" },
  ],
  aiUseCases: [
    { id:"AIU_01", title:"Natural-language reporting assistant", reqs:["FR_01","DATA_03"], pattern:"NL-to-SQL over governed semantic layer", human:"Analyst validates generated queries", deterministic:"Aggregations run in the warehouse; model only writes SQL." },
  ],
},
{
  id: "helio", tag: "AI-enabled solution",
  name: "Helio Telecom — AI Customer Support Assistant",
  context: { customer:"Helio Telecom", opportunity:"AI assistant to deflect and assist support contacts", regions:"US, CA", users:"~800 support agents + self-service customers", deadline:"5 months", cloud:"" },
  raw: `Helio wants an AI assistant on their support portal and inside the agent console. It should answer billing and plan questions from their knowledge base and account data, and suggest next-best-actions to agents.

It must escalate to a human when confidence is low or the topic is sensitive (cancellations, complaints). They care about hallucination control and want evaluation before launch. Integrates with Zendesk and their billing API.`,
  requirements: [
    { id:"BR_01", type:"Business", priority:"High", classification:"customer-stated", module:"AI Assist", description:"AI assistant to deflect and assist customer-support contacts.", sourceText:"AI assistant on their support portal and inside the agent console.", dependencies:[] },
    { id:"FR_01", type:"Functional", priority:"High", classification:"customer-stated", module:"AI Assist", description:"Answer billing and plan questions from knowledge base + account data.", sourceText:"answer billing and plan questions from their knowledge base and account data", dependencies:["DATA_01","INT_02"] },
    { id:"FR_02", type:"Functional", priority:"Medium", classification:"customer-stated", module:"AI Assist", description:"Suggest next-best-actions to agents in the console.", sourceText:"suggest next-best-actions to agents.", dependencies:[] },
    { id:"FR_03", type:"Functional", priority:"High", classification:"customer-stated", module:"AI Assist", description:"Escalate to human on low confidence or sensitive topics.", sourceText:"escalate to a human when confidence is low or the topic is sensitive", dependencies:["SEC_01"] },
    { id:"NFR_01", type:"Non-functional", priority:"High", classification:"customer-stated", module:"Quality", description:"Hallucination control with pre-launch evaluation.", sourceText:"hallucination control and want evaluation before launch.", dependencies:[] },
    { id:"INT_01", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Integrate with Zendesk.", sourceText:"Integrates with Zendesk", dependencies:[] },
    { id:"INT_02", type:"Integration", priority:"High", classification:"customer-stated", module:"Integration", description:"Integrate with billing API for account data.", sourceText:"and their billing API.", dependencies:[] },
    { id:"DATA_01", type:"Data", priority:"High", classification:"customer-stated", module:"Data", description:"Index knowledge base for retrieval.", sourceText:"from their knowledge base", dependencies:[] },
    { id:"SEC_01", type:"Security", priority:"Medium", classification:"ai-inferred", module:"Security", description:"Guardrails for sensitive-topic detection and safe escalation.", sourceText:"sensitive (cancellations, complaints) — controls implied.", dependencies:[] },
  ],
  assumptions: [
    { id:"ASM_01", text:"Knowledge base is reasonably current and machine-readable.", status:"needs-review" },
  ],
  openQuestions: [
    { id:"OQ_01", text:"What accuracy / deflection target defines launch readiness?", resolved:false, answer:"" },
    { id:"OQ_02", text:"What is the acceptable latency for the portal assistant?", resolved:false, answer:"" },
  ],
  aiUseCases: [
    { id:"AIU_01", title:"Grounded support Q&A", reqs:["FR_01","DATA_01","NFR_01"], pattern:"RAG with citation + confidence scoring", human:"Low-confidence routes to agent", deterministic:"Account facts fetched from billing API, not generated." },
    { id:"AIU_02", title:"Next-best-action suggestions", reqs:["FR_02"], pattern:"Retrieval + ranked recommendations", human:"Agent chooses the action", deterministic:"Eligibility rules enforced deterministically." },
  ],
},
{
  id: "nimbus", tag: "Important missing information",
  name: "Nimbus Health — Patient Portal (sparse brief)",
  context: { customer:"Nimbus Health", opportunity:"A patient portal, details TBD", regions:"", users:"", deadline:"", cloud:"" },
  raw: `We want a patient portal so people can see their appointments and message their care team. It should be secure. We might want some AI in there too. Not sure about budget yet. Timeline is "soon".`,
  requirements: [
    { id:"BR_01", type:"Business", priority:"High", classification:"customer-stated", module:"Platform", description:"Provide a patient portal for appointments and secure messaging.", sourceText:"a patient portal so people can see their appointments and message their care team.", dependencies:[] },
    { id:"FR_01", type:"Functional", priority:"High", classification:"customer-stated", module:"Portal", description:"View appointments.", sourceText:"see their appointments", dependencies:[] },
    { id:"FR_02", type:"Functional", priority:"Medium", classification:"customer-stated", module:"Portal", description:"Secure messaging with care team.", sourceText:"message their care team", dependencies:["SEC_01"] },
    { id:"SEC_01", type:"Security", priority:"High", classification:"ai-inferred", module:"Security", description:"Health-data security & likely regulatory compliance (HIPAA/GDPR — unconfirmed).", sourceText:"It should be secure. (regulatory regime not stated)", dependencies:[], openQuestion:"OQ_02" },
    { id:"FR_03", type:"Functional", priority:"Low", classification:"assumed", module:"AI Assist", description:"Possible AI capability (undefined).", sourceText:"We might want some AI in there too.", dependencies:[], openQuestion:"OQ_03" },
  ],
  assumptions: [
    { id:"ASM_01", text:"'Soon' is interpreted as a 4–6 month target pending confirmation.", status:"needs-review" },
    { id:"ASM_02", text:"Cloud platform is unconstrained; a recommendation is required.", status:"needs-review" },
  ],
  openQuestions: [
    { id:"OQ_01", text:"What is the budget / rate expectation for this engagement?", resolved:false, answer:"" },
    { id:"OQ_02", text:"Which regulatory regime applies (HIPAA, GDPR, other)?", resolved:false, answer:"" },
    { id:"OQ_03", text:"What specific AI capability is wanted, if any?", resolved:false, answer:"" },
    { id:"OQ_04", text:"Expected number of patients / concurrent users?", resolved:false, answer:"" },
  ],
  aiUseCases: [],
},
];
