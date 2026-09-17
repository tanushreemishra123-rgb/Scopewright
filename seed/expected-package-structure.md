# Expected scoping-package structure

The exported package (Markdown / DOCX / PDF) is assembled by `assemblePackage()` and
serialized in `src/export/`. Every export contains, in order:

1. Title + mandatory disclaimer
2. Executive summary
3. Requirements table (ID · type · priority · source classification · description)
4. Functional scope (capabilities, each citing requirement IDs)
5. Solution architecture (cloud-specific services, each citing supported requirement IDs)
6. Data strategy
7. Integration architecture
8. AI solution approach (use cases + recommended framework + responsible-AI)
9. Effort, timeline & ROM (line items + reproducible calculation + delivery phases)
10. Assumptions
11. Open questions
12. Requirement coverage & quality-gate results
13. Export status

The disclaimer text is fixed and asserted by the test suite.
