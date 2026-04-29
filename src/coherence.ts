/**
 * Coherence Estimation (Local, Non-Authoritative)
 *
 * This module provides local coherence estimates for UI preview,
 * developer calibration, and protocol study. It does NOT produce
 * canonical Seals, CTU, or on-chain verdicts.
 *
 * Canonical authority: LUX Runtime Oracle PDA on Solana mainnet
 * (8QTfNKF66N2uov4MfduioEjfaA6Hi8YBe8Lztoyxnzrk)
 *
 * Canonical specification: CTP/IP (R2 / operative R22).
 * Historical R1 record at DOI 10.5281/zenodo.18795109.
 *
 * Copyright 2025-2026 Ãrico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

import {
  PHI,
  EPSILON_0,
  GAMMA_MIN,
  GAMMA_BLOOM,
  GAMMA_ROOT,
  ALPHA_DEFAULT,
  Classification,
  CalibrationCheck,
} from './constants';

/** Raw coherence inputs */
export interface CoherenceInput {
  /** Energy commitment [0, 1] - normalised thermodynamic expenditure */
  E: number;
  /** Vector alignment [0, 1] - cosine similarity between intent and action */
  V: number;
  /** Attention persistence [0, 1] - negentropy measure */
  A: number;
  /** Temporal friction [0, infinity) - accumulated drift and resistance */
  tau: number;
}

/**
 * Local coherence estimate output.
 *
 * CTU is minted on-chain by LUX Runtime only. This SDK does not
 * produce CTU. The gamma estimate is for local UI preview and
 * developer calibration only.
 */
export interface LocalCoherenceEstimate {
  /** Coherence estimate [0, 1] - local preview only */
  gammaEstimate: number;
  /** Entropy delta (1 - gamma, must be > 0) */
  deltaS: number;
  /** Classification band label for UI preview only */
  classificationPreview: Classification;
  /** Local calibration check - NOT a canonical verdict */
  calibrationCheck: CalibrationCheck;
  /** Temporal debt estimate (only if calibration fails) */
  temporalDebtEstimate: number;
}

/**
 * Compute the Coherence Index (Gamma) estimate.
 *
 * Formula: Gamma = (E * V * A) / (tau + epsilon_0)
 *
 * Multiplicative structure is deliberate: if any single component
 * is zero, Gamma is zero. Energy without direction produces nothing.
 * Direction without energy produces nothing. Neither without sustained
 * attention produces anything.
 */
export function computeGamma(input: CoherenceInput): number {
  const { E, V, A, tau } = input;
  const gammaRaw = (E * V * A) / (tau + EPSILON_0);
  return Math.min(1.0, Math.max(0.0, gammaRaw));
}

/**
 * Classify a Gamma value into coherence tiers.
 * These are band labels for UI preview only.
 *
 * SEED:     [0.70, 0.8187)  - Carnot efficiency limit
 * BLOOM:    [0.8187, 0.95)  - Landauer erasure threshold
 * ROOT:     [0.95, 1.00)    - Relativistic threshold
 * REJECTED: [0, 0.70)       - Below measurable coherence
 *
 * Note: Gamma = 1.0 is thermodynamically impossible (Second Law).
 */
export function classify(gamma: number): Classification {
  if (gamma >= GAMMA_ROOT) return Classification.ROOT;
  if (gamma >= GAMMA_BLOOM) return Classification.BLOOM;
  if (gamma >= GAMMA_MIN) return Classification.SEED;
  return Classification.REJECTED;
}

/**
 * Compute temporal debt estimate for failed calibration checks.
 *
 * Formula: D = (V * E * A) / (Gamma + epsilon_0)
 *
 * Only fires when Gamma < Gamma_min.
 */
export function computeTemporalDebt(gamma: number, V: number, E: number, A: number): number {
  if (gamma >= GAMMA_MIN) return 0;
  return (V * E * A) / (gamma + EPSILON_0);
}

/**
 * Compute Attention from variance.
 *
 * Formula: A = 1 / (1 + alpha * sigma^2)
 *
 * As variance increases (more noise), Attention approaches zero.
 * As variance decreases (more focus), Attention approaches 1.
 */
export function computeAttention(
  gammaVariance: number,
  alpha: number = ALPHA_DEFAULT
): number {
  return 1 / (1 + alpha * gammaVariance);
}

/**
 * Estimate local coherence (non-authoritative).
 *
 * This is the local preview equivalent of the on-chain LUX Runtime
 * validation. It produces estimates only - never canonical Seals
 * or CTU.
 *
 * CTU is minted on-chain by LUX Runtime only. This SDK does not
 * produce CTU. The gamma estimate is for local UI preview and
 * developer calibration only.
 */
export function estimateLocalCoherence(input: CoherenceInput): LocalCoherenceEstimate {
  // Clamp inputs to [0, 1]
  const E = Math.min(1, Math.max(0, input.E));
  const V = Math.min(1, Math.max(0, input.V));
  const A = Math.min(1, Math.max(0, input.A));
  const tau = Math.max(0, input.tau);

  // Coherence estimate
  const gammaEstimate = computeGamma({ E, V, A, tau });

  // Entropy delta (must be > 0; Gamma = 1.0 is impossible)
  const deltaS = 1 - gammaEstimate;

  // Classification preview (band label for UI)
  const classificationPreview = classify(gammaEstimate);

  // Local calibration check (NOT a canonical verdict)
  const calibrationCheck = gammaEstimate >= GAMMA_MIN && deltaS > 0
    ? CalibrationCheck.PASSES_LOCAL_CALIBRATION
    : CalibrationCheck.FAILS_LOCAL_CALIBRATION;

  // Temporal debt estimate (only on failed calibration)
  const temporalDebtEstimate = calibrationCheck === CalibrationCheck.FAILS_LOCAL_CALIBRATION
    ? computeTemporalDebt(gammaEstimate, V, E, A)
    : 0;

  return { gammaEstimate, deltaS, classificationPreview, calibrationCheck, temporalDebtEstimate };
}

