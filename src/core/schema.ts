const REQ_TYPES = ["Business","Functional","Non-functional","Integration","Data","Security"];
const CLASSES = ["customer-stated","ai-inferred","assumed"];
const PRIORITIES = ["High","Medium","Low"];
const ID_RE = /^(BR|FR|NFR|INT|DATA|SEC)_\d{2}$/;

export interface ValidationIssue { path: string; message: string; }

/** Validate a single extracted requirement against the expected structured shape. */
export function validateRequirement(r: any, i = 0): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const at = (m: string) => ({ path: `requirements[${i}]`, message: m });
  if (!r || typeof r !== "object") return [at("not an object")];
  if (typeof r.id !== "string" || !ID_RE.test(r.id)) issues.push(at(`invalid id "${r.id}" (expected e.g. FR_01)`));
  if (!REQ_TYPES.includes(r.type)) issues.push(at(`invalid type "${r.type}"`));
  if (!PRIORITIES.includes(r.priority)) issues.push(at(`invalid priority "${r.priority}"`));
  if (!CLASSES.includes(r.classification)) issues.push(at(`invalid classification "${r.classification}"`));
  if (typeof r.description !== "string" || r.description.trim().length < 3) issues.push(at("missing description"));
  if (typeof r.sourceText !== "string" || r.sourceText.trim().length < 1) issues.push(at("missing sourceText (traceability required)"));
  if (!Array.isArray(r.dependencies)) issues.push(at("dependencies must be an array"));
  return issues;
}

/** Validate a full analysis result before it is admitted into the scope model. */
export function validateAnalysis(a: any): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!a || typeof a !== "object") return { ok: false, issues: [{ path: "root", message: "analysis is not an object" }] };
  if (!Array.isArray(a.requirements) || a.requirements.length === 0)
    issues.push({ path: "requirements", message: "at least one requirement is required" });
  else a.requirements.forEach((r: any, i: number) => issues.push(...validateRequirement(r, i)));
  for (const k of ["assumptions", "openQuestions", "aiUseCases"])
    if (a[k] !== undefined && !Array.isArray(a[k])) issues.push({ path: k, message: `${k} must be an array` });
  // duplicate id check
  const ids = (a.requirements || []).map((r: any) => r?.id);
  const dupes = ids.filter((id: string, i: number) => id && ids.indexOf(id) !== i);
  if (dupes.length) issues.push({ path: "requirements", message: `duplicate ids: ${[...new Set(dupes)].join(", ")}` });
  return { ok: issues.length === 0, issues };
}
