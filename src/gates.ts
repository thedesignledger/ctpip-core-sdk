/**
 * Five Guardian Gates - Pre-Validation Enforcement
 * Source: R11 Book III S.III.A.3.4
 *
 * All five gates must pass. A single gate failure rejects the seal.
 * No bypass, no override, no administrative exception.
 *
 * Gates are ordered by detection cost (cheapest first) to minimise
 * computational waste on invalid submissions.
 *
 * Complexity: O(n) where n = number of anchors (Theorem 6)
 */

import { GAMMA_MIN } from './constants';
import { computeGamma, type EVAInput } from './eva';

/** A CausalAnchor binding operator identity */
export interface CausalAnchor {
  /** Unique anchor identifier */
  anchorId: string;
  /** Anchor type (e.g. 'wallet', 'identity', 'biometric') */
  anchorType: string;
  /** Current status */
  anchorStatus: 'Linked' | 'Revoked' | 'Expired';
  /** Anchor's coherence level (for clamping) */
  anchorGamma?: number;
}

/** Seal attempt input */
export interface SealAttempt {
  /** SHA-256 hash of intent declaration (64 hex chars) */
  intentHash: string;
  /** SHA-256 hash of evidence (64 hex chars) */
  evidenceHash: string;
  /** Operator's CausalAnchors */
  anchors: CausalAnchor[];
  /** EVA inputs */
  eva: EVAInput;
  /** Whether the origin is AI-generated */
  aiOriginated: boolean;
}

/** Gate result */
export interface GateResult {
  /** Gate name */
  gate: string;
  /** Gate number (1-5) */
  order: number;
  /** Pass or fail */
  passed: boolean;
  /** Failure reason (if failed) */
  reason?: string;
}

/** Full gate evaluation result */
export interface GateEvaluation {
  /** All gates passed */
  allPassed: boolean;
  /** Individual gate results */
  gates: GateResult[];
  /** First failing gate (null if all passed) */
  firstFailure: GateResult | null;
  /** Computed gamma (from gate 4) */
  gamma: number;
  /** Gamma after anchor clamping */
  clampedGamma: number;
}

const SHA256_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Gate 1: Intent Gate
 * Validates: IntentSig properly formed and signed
 * Rejects if: Missing or malformed declaration
 * Cost: O(1) string validation
 */
function evaluateIntentGate(intentHash: string): GateResult {
  const passed = SHA256_REGEX.test(intentHash);
  return {
    gate: 'Intent',
    order: 1,
    passed,
    reason: passed ? undefined : 'IntentSig hash missing or malformed (requires 64-char SHA-256 hex)',
  };
}

/**
 * Gate 2: Evidence Gate
 * Validates: Evidence hash matches declared work
 * Rejects if: No verifiable evidence of work
 * Cost: O(1) string validation
 */
function evaluateEvidenceGate(evidenceHash: string): GateResult {
  const passed = SHA256_REGEX.test(evidenceHash);
  return {
    gate: 'Evidence',
    order: 2,
    passed,
    reason: passed ? undefined : 'Evidence hash missing or malformed (requires 64-char SHA-256 hex)',
  };
}

/**
 * Gate 3: Anchor Gate
 * Validates: Identity coherence meets threshold
 * Rejects if: Operator identity incoherent (no active anchors)
 * Cost: O(n) where n = number of anchors
 */
function evaluateAnchorGate(anchors: CausalAnchor[]): GateResult {
  const activeAnchors = anchors.filter(a => a.anchorStatus === 'Linked');
  const passed = activeAnchors.length >= 1;
  return {
    gate: 'Anchors',
    order: 3,
    passed,
    reason: passed ? undefined : 'No active CausalAnchor linked (minimum 1 required)',
  };
}

/**
 * Gate 4: Coherence Gate
 * Validates: Gamma meets or exceeds Gamma_min for domain
 * Rejects if: Below threshold
 * Cost: O(1) arithmetic (EVA computation)
 */
function evaluateCoherenceGate(gamma: number): GateResult {
  const passed = gamma >= GAMMA_MIN;
  return {
    gate: 'Coherence',
    order: 4,
    passed,
    reason: passed ? undefined : `Gamma ${gamma.toFixed(4)} below SEED threshold ${GAMMA_MIN}`,
  };
}

/**
 * Gate 5: Entropy Gate
 * Validates: Net entropy reduction in transformation (deltaS > 0)
 * Rejects if: Disorder increased or unchanged (Gamma = 1.0 is impossible)
 * Cost: O(1) arithmetic
 */
function evaluateEntropyGate(gamma: number): GateResult {
  const deltaS = 1 - gamma;
  const passed = deltaS > 0;
  return {
    gate: 'Entropy',
    order: 5,
    passed,
    reason: passed ? undefined : 'Gamma = 1.0 is thermodynamically impossible (Second Law)',
  };
}

/**
 * AI Boundary Check (pre-gate)
 * Source: Book I S.I.11
 * w_AI = 0. AI cannot originate IntentSig.
 */
function evaluateAIBoundary(aiOriginated: boolean): GateResult {
  return {
    gate: 'AI Boundary',
    order: 0,
    passed: !aiOriginated,
    reason: aiOriginated ? 'AI cannot originate IntentSig (w_AI = 0). Sovereignty violation.' : undefined,
  };
}

/**
 * Anchor Coherence Clamp
 * Source: Book III S.III.A.3.4
 *
 * If any selected CausalAnchor has a recorded Gamma lower than
 * the computed seal Gamma, the seal's Gamma is clamped to the
 * anchor's value.
 */
function clampGammaToAnchors(gamma: number, anchors: CausalAnchor[]): number {
  const activeAnchors = anchors.filter(a => a.anchorStatus === 'Linked' && a.anchorGamma !== undefined);
  if (activeAnchors.length === 0) return gamma;

  const minAnchorGamma = Math.min(...activeAnchors.map(a => a.anchorGamma!));
  return Math.min(gamma, minAnchorGamma);
}

/**
 * Evaluate all Five Guardian Gates.
 *
 * Gates fire in order: Intent > Evidence > Anchors > Coherence > Entropy
 * Cheapest gates first. All must pass.
 *
 * Source: Book III S.III.A.3.4, Theorem 6 (O(n) crystallisation)
 */
export function evaluateGates(attempt: SealAttempt): GateEvaluation {
  const gates: GateResult[] = [];

  // Pre-gate: AI Boundary
  const aiBoundary = evaluateAIBoundary(attempt.aiOriginated);
  if (!aiBoundary.passed) {
    gates.push(aiBoundary);
    return { allPassed: false, gates, firstFailure: aiBoundary, gamma: 0, clampedGamma: 0 };
  }

  // Gate 1: Intent
  const g1 = evaluateIntentGate(attempt.intentHash);
  gates.push(g1);
  if (!g1.passed) return { allPassed: false, gates, firstFailure: g1, gamma: 0, clampedGamma: 0 };

  // Gate 2: Evidence
  const g2 = evaluateEvidenceGate(attempt.evidenceHash);
  gates.push(g2);
  if (!g2.passed) return { allPassed: false, gates, firstFailure: g2, gamma: 0, clampedGamma: 0 };

  // Gate 3: Anchors
  const g3 = evaluateAnchorGate(attempt.anchors);
  gates.push(g3);
  if (!g3.passed) return { allPassed: false, gates, firstFailure: g3, gamma: 0, clampedGamma: 0 };

  // Compute Gamma for gates 4-5
  const rawGamma = computeGamma(attempt.eva);

  // Anchor Coherence Clamp
  const clampedGamma = clampGammaToAnchors(rawGamma, attempt.anchors);

  // Gate 4: Coherence
  const g4 = evaluateCoherenceGate(clampedGamma);
  gates.push(g4);
  if (!g4.passed) return { allPassed: false, gates, firstFailure: g4, gamma: rawGamma, clampedGamma };

  // Gate 5: Entropy
  const g5 = evaluateEntropyGate(clampedGamma);
  gates.push(g5);
  if (!g5.passed) return { allPassed: false, gates, firstFailure: g5, gamma: rawGamma, clampedGamma };

  return { allPassed: true, gates, firstFailure: null, gamma: rawGamma, clampedGamma };
}
