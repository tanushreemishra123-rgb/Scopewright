# Scopewright — AI Deal Scoping Assistant

Turns unstructured customer requirements (RFPs, discovery notes, emails) into a **structured, traceable, reviewable solution-scoping package**: a connected scope model that produces a PRD, a cloud-specific architecture, a data/integration/AI strategy, and a reproducible ROM estimate — all tracing back to the same reviewed requirements.

> This is an internal planning aid, not a final quotation, contractual commitment, architecture approval, or delivery guarantee.

## Demo video

▶️ **Demo:** _<add your video link here>_ &nbsp;(recommended 3–5 min; walkthrough steps in the demo notes)

## Architecture

See **[`docs/ARCHITECTURE.html`](docs/ARCHITECTURE.html)** for a self-contained, rendered architecture diagram (component layers + data-flow) and a node-to-code map. Open it in any browser.

## Why it's not a prompt-to-document tool

Everything downstream is a **pure function of one shared scope model** (`Session`). Edit or exclude a requirement and the PRD, coverage, architecture and estimate all recompute. Requirement IDs (`BR/FR/NFR/INT/DATA/SEC`) carry source text and a classification, and flow through every deliverable, so coverage and consistency are *computed*, not eyeballed.

## Architecture & code organization

Concerns are separated by responsibility, not crammed into one component:

- **`src/App.jsx` — the shell only (~87 lines).** Global state (scope model, cloud, estimate config), localStorage persistence, stage routing, and the sidebar/header. It contains no deliverable logic.
- **`src/ui/*` — one module per stage.** `Landing`, `RequirementsStage`, `PRDStage`, `ArchitectureStage`, `StrategyStage`, `EstimateStage`, `PackageStage`, each opening with a doc comment stating its single responsibility and the requirement it serves.
- **`src/ui/primitives.jsx` — shared UI + design tokens.** One source of the chip/button/card styling and the requirement-classification palette, so styling isn't duplicated across stages (DRY).
- **`src/core/*` — the pure, framework-agnostic engine and single source of truth.** All generation (`generators.ts`), estimation (`estimate.ts`), coverage/traceability, change-impact (`changeImpact.ts`), quality gate (`quality.ts`), schema validation (`schema.ts`) and package assembly (`packageModel.ts`) are pure functions with **no React and no I/O** — which is exactly why they are unit-tested directly (46 tests). The UI renders their output; it never re-implements logic.
- **`src/providers/*`** (mock + optional live AI behind one interface) and **`src/export/*`** (Markdown/DOCX/PDF serializers) are likewise isolated.

The result: the same scope model drives the UI, the exports and the tests, with no duplicated business logic between them.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173  (Mock AI mode — no key needed)
npm test          # 21 tests (estimation, coverage, change-impact, consistency, schema)
npm run build     # -> dist/index.html : a single self-contained file, open in any browser
npm run preview   # serve the built single-file app
```

Requires Node 18+. `dist/index.html` inlines all JS/CSS (via `vite-plugin-singlefile`), so a reviewer can also just open that one file.

## Configure an optional AI provider

The app works fully **without any AI key** — mock mode runs the entire seeded experience. To enable a live provider, copy `.env.example` to `.env` and set an OpenAI-compatible endpoint:

```
VITE_AI_BASE_URL=https://api.openai.com/v1
VITE_AI_API_KEY=sk-...
VITE_AI_MODEL=gpt-4o-mini
```

`getProvider()` selects the live provider only when both URL and key are present. Its structured output is **schema-validated**; on any invalid response or network error it **falls back to mock**. Seed scenarios always use deterministic seeded analysis.

## How mock AI mode works

`src/providers/index.ts` exposes a `Provider` interface with a single `analyze(input)` method. `mockProvider` returns either a seeded scenario (deterministic) or a heuristic extraction of pasted text (`src/core/analyze.ts`). It needs no network and is always available, so the full flow — analysis, scope model, traceability, PRD, architecture, data/AI, estimation, change-impact, quality gate, export — runs for free.

## How the pipeline works

- **Requirements processed** → `provider.analyze` yields a candidate analysis; `src/core/schema.ts` (`validateAnalysis`) validates IDs, required `sourceText`, enums and duplicates before it enters the model.
- **Scope model produced & reviewed** → the `Session` (`src/core/types.ts`) holds requirements, assumptions and open questions. The Requirements stage lets you edit descriptions/priorities/classifications, exclude items, resolve questions, and **approve** — approval gates all downstream generation.
- **Source traceability** → each requirement stores `sourceText` + `classification` (customer-stated / AI-inferred / assumed). Capabilities, architecture components, AI use cases and estimate rows store the requirement IDs they consume.
- **PRD & functional scope** → `buildCapabilities` groups included requirements into capabilities by logical module; `buildPRDExtras` derives dependencies, out-of-scope items and recommended enhancements (the AI-inferred requirements); personas, user journeys and a first-class **risk model** come from the reviewed scope; `computeCoverage` reports covered / uncovered / dangling references.
- **Cloud architecture** → `buildArchitecture(session, cloud)` maps logical components to **cloud-specific services** (`cloudMap.ts`) for AWS/Azure/GCP; every functional component references the requirements that justify it and lists rationale, trade-offs and security notes.
- **Data / integration / AI** → `buildDataStrategy`, `buildIntegration`, `buildAI` derive strategy from the DATA/INT requirements and AI use cases; the AI recommendation includes a solution-specific framework rationale and an explicit deterministic-vs-generative boundary.
- **Effort & ROM** → `computeEstimate` (below), including a **role/skill breakdown** (rate-card × role mix), effort **ranges**, phase **milestones**, and **delivery risks**.
- **Change-impact** → `computeChangeImpact` returns a **new** model plus an affected/unaffected map; reviewed unaffected content is never mutated in place.
- **Consistency & coverage** → `runQualityGate` checks high-priority coverage, uncovered requirements, dangling references, unjustified components, AI safety/eval/human-review, unresolved questions, estimation inputs and assumptions.
- **Export** → `src/export` serializes the assembled package to Markdown, DOCX (`docx`) and print-to-PDF, each with the mandatory disclaimer.

## How effort & ROM are estimated (reproducible)

Every number derives from visible scope factors and configurable commercial inputs — never from free-text model output:

```
base       = Σ capability(complexity) + Σ integration(complexity) + Σ aiUseCase(High)
subtotal   = base + securityUplift(10% if ≥2 sec reqs) + testingUplift(15%)
                  + environmentsUplift(2/extra env) + dataMigrationUplift(8 if enabled)
totalWeeks = subtotal + contingency(contingency% × subtotal)
ROM        = totalWeeks × blendedRate    (range ±band by confidence)
```

Effort tables and bands are in `seed/estimation-config.json` / `src/core/estimate.ts`. Confidence starts High and drops with unresolved questions / unreviewed assumptions; missing inputs (no cloud, no rate) flag the estimate as low-confidence/blocked rather than inventing precision. Changing only the rate changes cost but not effort (asserted by tests).

## How change-impact works

Pick a change (cloud, user volume ×10, contingency, drop a low-priority requirement). `computeChangeImpact` applies it immutably and returns the affected outputs (which then recalculate from the model) and the preserved ones. Example: switching cloud re-maps every architecture service but leaves scope, personas and person-week effort untouched.

## How consistency & coverage are checked

`computeCoverage` compares included requirements against every ID referenced downstream → coverage %, uncovered requirements, and **dangling references** (an output still citing an excluded requirement = an unsupported recommendation). `runQualityGate` rolls these plus AI/estimation/assumption checks into an export status: *Ready to export* / *Review required* / *Blocked*.

## How customer data is stored / protected

No backend and no telemetry. Requirements live only in the browser tab and are persisted to that browser's `localStorage` for session continuity; **New session** clears it. Live-provider calls (if configured) go directly from the browser to your configured endpoint. Nothing is sent anywhere in mock mode.

## Project structure

```
src/
  core/        pure engine (single source of truth)
    types.ts cloudMap.ts scenarios.ts analyze.ts ingest.ts schema.ts
    generators.ts estimate.ts changeImpact.ts quality.ts packageModel.ts
  providers/   mock + optional live AI behind one interface
  export/      markdown.ts docx.ts print/pdf
  App.jsx      app shell: global state, stage routing, sidebar + header
  ui/          per-stage screens + shared primitives
               (Landing, Requirements, PRD, Architecture, Strategy, Estimate, Package)
tests/         vitest: schema, estimate, model/coverage/change-impact/quality, ingest
seed/          sample requirements, context, estimation + rate + commercial config,
               mock responses, JSON schemas, expected package structure
docs/          ARCHITECTURE.html (self-contained diagram)
```

## Seed scenarios

`Orion Retail` (modernization + AI + integrations, with missing info), `Meridian Insurance` (data/integration-heavy), `Helio Telecom` (AI-enabled), `Nimbus Health` (sparse brief — important missing information). Plus paste-your-own, or upload a requirements document (.txt, .md, .pdf, .docx) — text is extracted browser-side (`src/core/ingest.ts`) and fed to the same heuristic analyzer.

## Tests

```bash
npm test
```

Covers structured-output validation, requirement traceability, coverage checks, unsupported-recommendation (dangling) detection, effort & ROM calculation, rate/contingency changes, missing estimation inputs, change-impact identification, immutability, and cross-document consistency / quality-gate status.

## Assumptions & known limitations

- Mock analysis is seeded/heuristic; the heuristic extractor for arbitrary text is deliberately simple (keyword-based) and always marks items AI-inferred for reviewer confirmation.
- The architecture diagram is a tiered logical view (not a vendor icon diagram).
- ROM uses a single configurable blended rate for the headline figure; a **role/skill breakdown** (in `seed/rate-card.json` and `estimate.ts`) allocates the same effort across roles as an indicative role costing.
- PDF export uses the browser's print-to-PDF; DOCX uses the `docx` library.
