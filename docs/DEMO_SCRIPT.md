# Demo script (3–5 minutes)

Target length ~4 min. Use the **Orion Retail** seed — it exercises modernization, AI, integrations, and missing information.

| # | Time | Screen | Say / do |
|---|------|--------|----------|
| 1 | 0:00 | Landing | "Scopewright turns raw customer requirements into a traceable scoping package. It runs entirely in the browser in mock AI mode — no paid provider." Click **Orion Retail**. |
| 2 | 0:20 | Requirements | "The requirements are extracted with traceable IDs and classified as customer-stated, AI-inferred or assumed." Click **source** on FR_02 to show the originating customer text. |
| 3 | 0:45 | Requirements | Change FR_04 priority; toggle a requirement out of scope to show it's editable. Show the **assumptions needing review** and **clarification questions** panels. |
| 4 | 1:05 | Requirements | Click **Approve the requirements** — "downstream generation only runs on a reviewed model." |
| 5 | 1:15 | PRD & Scope | "Capabilities are generated from the approved scope and each cites requirement IDs." Point to the **coverage** meter and the uncovered list. |
| 6 | 1:40 | Architecture | Click **Recommend a platform** (picks Azure for Orion — Entra/SSO). Show the tiered diagram and a component card: cloud-specific service + supported requirement IDs + rationale + trade-off. Switch to AWS to show services re-map. |
| 7 | 2:10 | Data · Integration · AI | Tab through the three. On **AI solution**, highlight the recommended framework *with rationale*, the deterministic-vs-AI boundary, and responsible-AI points. |
| 8 | 2:40 | Estimate & ROM | "Every number is reproducible." Walk the calculation block. Drag **contingency** and change the **rate** — watch ROM update; note effort (person-weeks) stays fixed when only the rate changes. Show **confidence** dropping due to open questions. |
| 9 | 3:10 | Package | Click **Switch cloud** and **User volume ×10** — show the affected-vs-preserved impact map. Then read the **quality gate**: coverage, dangling refs, unresolved questions. |
| 10 | 3:35 | Package | Click **Export Markdown** (and mention DOCX / PDF). Open the file; point to the mandatory disclaimer and the requirement-traceability tables. |
| 11 | 3:50 | Terminal (optional) | `npm test` — "21 tests cover estimation, coverage, change-impact and consistency." |
| 12 | 4:00 | — | "Mock mode ran the entire flow with no paid AI. Thanks for watching." |
