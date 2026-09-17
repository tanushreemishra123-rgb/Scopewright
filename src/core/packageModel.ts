import type { Session, EstimateConfig, Cloud } from "./types";
import { buildCapabilities, buildArchitecture, buildDataStrategy, buildIntegration, buildAI, includedReqs } from "./generators";
import { computeCoverage, computeEstimate } from "./estimate";
import { runQualityGate } from "./quality";

export const DISCLAIMER =
  "This document is an AI-assisted internal planning output based on customer requirements and stated assumptions. It requires review and validation by qualified sales, architecture, delivery, security, and commercial stakeholders. It is not a final quote, contractual commitment, or delivery guarantee.";

/** Assemble the full, consistent scoping package from the shared scope model. */
export function assemblePackage(session: Session, cloud: Cloud | "", cfg: EstimateConfig) {
  const s = { ...session, context: { ...session.context, cloud } };
  const caps = buildCapabilities(s);
  const arch = cloud ? buildArchitecture(s, cloud as Cloud) : null;
  const ai = buildAI(s);
  const data = buildDataStrategy(s);
  const integ = buildIntegration(s);
  const cov = computeCoverage(s, caps, arch, ai);
  const est = computeEstimate(s, caps, cfg);
  const gate = runQualityGate(s, caps, arch, ai, cov, est);
  return { session: s, caps, arch, ai, data, integ, cov, est, gate, included: includedReqs(s), disclaimer: DISCLAIMER };
}
export type ScopingPackage = ReturnType<typeof assemblePackage>;
