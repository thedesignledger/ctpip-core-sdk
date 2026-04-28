/**
 * Welford Online Variance - Calibration Statistics
 *
 * Numerically stable online algorithm for computing running
 * mean and variance. Used to establish operator's behavioural
 * fingerprint during Genesis calibration and ongoing anomaly detection.
 *
 * Reference: Welford, B. P. (1962). "Note on a method for
 * calculating corrected sums of squares and products."
 * Technometrics, 4(3), 419-420.
 *
 * Canonical specification: CTP/IP (R2 / operative R22).
 * Historical R1 record at DOI 10.5281/zenodo.18795109.
 *
 * Copyright 2025-2026 Erico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

export interface WelfordState {
  /** Number of samples observed */
  count: number;
  /** Running mean */
  mean: number;
  /** Running M2 (sum of squared differences from mean) */
  m2: number;
}

/**
 * Create a fresh Welford state.
 */
export function welfordInit(): WelfordState {
  return { count: 0, mean: 0, m2: 0 };
}

/**
 * Update Welford state with a new observation.
 * Returns a NEW state (immutable).
 */
export function welfordUpdate(state: WelfordState, value: number): WelfordState {
  const count = state.count + 1;
  const delta = value - state.mean;
  const mean = state.mean + delta / count;
  const delta2 = value - mean;
  const m2 = state.m2 + delta * delta2;
  return { count, mean, m2 };
}

/**
 * Get population variance from Welford state.
 * Returns 0 if count < 2.
 */
export function welfordVariance(state: WelfordState): number {
  if (state.count < 2) return 0;
  return state.m2 / state.count;
}

/**
 * Get sample variance from Welford state.
 * Returns 0 if count < 2.
 */
export function welfordSampleVariance(state: WelfordState): number {
  if (state.count < 2) return 0;
  return state.m2 / (state.count - 1);
}

/**
 * Get standard deviation from Welford state.
 */
export function welfordStdDev(state: WelfordState): number {
  return Math.sqrt(welfordVariance(state));
}

/**
 * Multi-channel Welford tracker for coherence calibration.
 * Tracks independent statistics for each input channel.
 */
export interface CoherenceCalibration {
  E: WelfordState;
  V: WelfordState;
  A: WelfordState;
  gamma: WelfordState;
  cycleCount: number;
}

/**
 * Create a fresh coherence calibration tracker.
 */
export function calibrationInit(): CoherenceCalibration {
  return {
    E: welfordInit(),
    V: welfordInit(),
    A: welfordInit(),
    gamma: welfordInit(),
    cycleCount: 0,
  };
}

/**
 * Record one calibration cycle.
 */
export function calibrationRecord(
  cal: CoherenceCalibration,
  E: number,
  V: number,
  A: number,
  gamma: number
): CoherenceCalibration {
  return {
    E: welfordUpdate(cal.E, E),
    V: welfordUpdate(cal.V, V),
    A: welfordUpdate(cal.A, A),
    gamma: welfordUpdate(cal.gamma, gamma),
    cycleCount: cal.cycleCount + 1,
  };
}

/**
 * Check if calibration enrollment is complete.
 * Requires minimum 10 cycles.
 */
export function calibrationReady(cal: CoherenceCalibration): boolean {
  return cal.cycleCount >= 10;
}

/**
 * Get calibration fingerprint summary.
 */
export function calibrationFingerprint(cal: CoherenceCalibration) {
  return {
    cycles: cal.cycleCount,
    ready: calibrationReady(cal),
    E: { mean: cal.E.mean, variance: welfordVariance(cal.E), stddev: welfordStdDev(cal.E) },
    V: { mean: cal.V.mean, variance: welfordVariance(cal.V), stddev: welfordStdDev(cal.V) },
    A: { mean: cal.A.mean, variance: welfordVariance(cal.A), stddev: welfordStdDev(cal.A) },
    gamma: { mean: cal.gamma.mean, variance: welfordVariance(cal.gamma), stddev: welfordStdDev(cal.gamma) },
  };
}
