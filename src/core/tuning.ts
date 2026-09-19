/**
 * Central, documented tuning constants for the estimation, quality-gate and change-impact
 * engines. Every weight, threshold, uplift, rate and delta the logic uses lives here as a
 * NAMED value — no magic numbers scattered through the code — so the calculation rules are
 * auditable and reproducible from one place. Changing a rule means changing one line here.
 *
 * Groups:
 *  - effort         person-weeks per workstream by complexity
 *  - uplift         percentage/fixed uplifts added to the base effort
 *  - confidence     ROM/effort ± bands and the triggers that lower confidence
 *  - delivery       parallelism cap and per-phase share of elapsed timeline
 *  - roleRates      weekly rate per role (day rate × 5); mirrors seed/rate-card.json
 *  - roleMix        fraction of each workstream category's effort per role
 *  - currencyLocale digit-grouping locale per currency
 *  - change         deltas the change-impact "what-if" buttons apply
 *  - quality        thresholds/exemptions used by the pre-export quality gate
 */
export const TUNING = {
  // Person-weeks per workstream, by complexity level.
  effort: {
    capability:  { Low: 3, Medium: 6, High: 10 },  // per functional capability
    integration: { Low: 2, Medium: 4, High: 6 },   // per external-system integration
    ai:          { Low: 4, Medium: 6, High: 10 },  // per AI use case
  },

  // Uplifts applied to the base workstream total.
  uplift: {
    securityPct: 0.10,          // +10% of base when security reqs reach the threshold
    securityReqThreshold: 2,    // apply the security uplift at ≥ this many security reqs
    testingPct: 0.15,           // +15% of base for testing & hardening
    envPerExtraEnv: 2,          // +2 pw per environment beyond the first
    dataMigration: 8,           // +8 pw when data migration is required
    cloudComplexityPct: { Low: 0, Medium: 0.05, High: 0.10 }, // +% of base by cloud-infra complexity
  },

  // Confidence ± band (fraction of effort/ROM) and the triggers that set the level.
  confidence: {
    band: { High: 0.12, Medium: 0.20, Low: 0.30 },
    mediumWhenOpenQuestions: 1,       // ≥ this many unresolved questions → Medium
    lowWhenOpenQuestions: 3,          // ≥ this many unresolved questions → Low
    lowWhenAssumptionsNeedReview: 3,  // ≥ this many needs-review assumptions → Low
  },

  // Delivery timeline shaping.
  delivery: {
    maxParallelWorkstreams: 4,                          // caps parallelism when deriving elapsed weeks
    phaseWeights: [0.10, 0.28, 0.22, 0.18, 0.14, 0.08], // share of elapsed duration per P1…P6
  },

  // Role weekly rates (day rate × 5). Mirrors seed/rate-card.json.
  roleRates: {
    "Solution Architect": 5750, "Tech Lead": 5000, "Senior Engineer": 4250, "Engineer": 3250,
    "Data Engineer": 4000, "AI/ML Engineer": 4750, "QA Engineer": 3000, "Delivery Manager": 4500, "Business Analyst": 3500,
  } as Record<string, number>,

  // Role mix per workstream category (fractions of that category's effort; each set ≈ 1.0).
  roleMix: {
    capability:  { "Delivery Manager": 0.08, "Tech Lead": 0.15, "Senior Engineer": 0.32, "Engineer": 0.32, "Business Analyst": 0.13 },
    integration: { "Delivery Manager": 0.08, "Tech Lead": 0.15, "Data Engineer": 0.33, "Senior Engineer": 0.32, "Engineer": 0.12 },
    ai:          { "Solution Architect": 0.10, "AI/ML Engineer": 0.45, "Senior Engineer": 0.28, "Tech Lead": 0.17 },
    security:    { "Solution Architect": 0.40, "Senior Engineer": 0.60 },
    testing:     { "QA Engineer": 0.70, "Engineer": 0.30 },
    other:       { "Data Engineer": 0.50, "Engineer": 0.50 },
  } as Record<string, Record<string, number>>,

  // Digit-grouping locale per currency (so INR groups 2-2-3 and others 3-3-3).
  currencyLocale: { INR: "en-IN", USD: "en-US", GBP: "en-GB", EUR: "en-IE" } as Record<string, string>,

  // Deltas the change-impact "what-if" buttons apply.
  change: {
    userVolumeContingencyBump: 5, // +5 percentage points of contingency for a 10× user jump
    contingencyTarget: 30,        // the "Contingency → 30%" preset
    rateMultiplier: 1.15,         // "Rate card +15%"
    deadlineTeamBump: 3,          // "+3" team members to compress the timeline
    maxContingency: 40,           // hard cap on contingency %
    maxTeamSize: 14,              // hard cap on team size
  },

  // Pre-export quality gate.
  quality: {
    minResponsibleAiConsiderations: 3,               // AI use cases must carry ≥ this many responsible-AI notes
    unjustifiedComponentExemptKeys: ["obs", "cicd"], // cross-cutting components exempt from the requirement-justification check
  },
} as const;
