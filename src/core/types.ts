// Shared domain model. The Session is the single, reviewable scope model that
// every downstream deliverable is derived from.

export type Classification = "customer-stated" | "ai-inferred" | "assumed";
export type Priority = "High" | "Medium" | "Low";
export type ReqType =
  | "Business" | "Functional" | "Non-functional"
  | "Integration" | "Data" | "Security";
export type Cloud = "aws" | "azure" | "gcp";

export interface Requirement {
  id: string;                 // e.g. FR_01 — traceable identifier
  type: ReqType;
  priority: Priority;
  classification: Classification;
  module: string;             // logical grouping used to build capabilities
  description: string;
  sourceText: string;         // originating customer text (traceability)
  dependencies: string[];
  openQuestion?: string;      // id of a linked clarification question
  included?: boolean;         // reviewer can exclude without deleting
}

export interface Assumption { id: string; text: string; status: "proposed" | "confirmed" | "needs-review"; }
export interface OpenQuestion { id: string; text: string; resolved: boolean; answer: string; }
export interface AiUseCase { id: string; title: string; reqs: string[]; pattern: string; human: string; deterministic: string; }
export interface Persona { id: string; name: string; description: string; needs: string; }
export interface UserJourney { id: string; name: string; steps: string[]; reqs: string[]; }
export interface Risk { id: string; description: string; severity: Priority; category: "Delivery" | "Technical" | "Commercial" | "Compliance"; mitigation: string; reqs: string[]; }

export interface CustomerContext {
  customer: string; opportunity: string;
  regions?: string; users?: string; deadline?: string; cloud?: string;
}

export interface Session {
  id: string;
  name: string;
  tag: string;
  context: CustomerContext;
  raw: string;
  requirements: Requirement[];
  assumptions: Assumption[];
  openQuestions: OpenQuestion[];
  aiUseCases: AiUseCase[];
  personas?: Persona[];
  journeys?: UserJourney[];
  risks?: Risk[];
  approved?: boolean;
}

export interface Capability { name: string; reqs: string[]; priority: Priority; scope: string; complexity: Priority; dependencies: string[]; }
export interface ArchComponent { key: string; name: string; service: string; purpose: string; rationale: string; reqIds: string[]; tradeoff: string; sec: string; }
export interface Architecture { cloud: Cloud; components: ArchComponent[]; }

export interface EstimateConfig {
  blendedRate: number; currency: string; contingency: number;
  teamSize: number; weeklyHours: number; environments: number; dataMigration: boolean;
}

export interface Coverage { total: number; covered: number; uncovered: Requirement[]; dangling: string[]; pct: number; }
