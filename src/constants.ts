/**
 * CTP/IP Protocol Constants (Reference Only)
 *
 * These constants are exposed for reference and local calibration.
 * Enforcement of protocol invariants -- including the AI Boundary
 * (w_AI = 0), EVA Lock, Anti-Circularity, and Binary Validation --
 * happens on-chain at the canonical authority. This SDK does not
 * and cannot enforce them.
 *
 * Canonical specification: CTP/IP (R2 / operative R22).
 * Historical R1 record at DOI 10.5281/zenodo.18795109.
 * R2 publication forthcoming.
 *
 * Copyright 2025-2026 Erico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

/** Golden Ratio - temporal scaling constant */
export const PHI = 1.618033988749895;

/** Lux Limit - upper bound of causal energy density */
export const LAMBDA_LUX = 8.98755178736818e16;

/** Stability constant - division-by-zero guard */
export const EPSILON_0 = 1.0;

/** SEED threshold - Carnot efficiency limit */
export const GAMMA_MIN = 0.70;

/** BLOOM threshold - Landauer erasure limit */
export const GAMMA_BLOOM = 0.8187;

/** ROOT threshold - relativistic coherence */
export const GAMMA_ROOT = 0.95;

/** Default ALPHA for attention computation */
export const ALPHA_DEFAULT = 8.0;

/** Parity Law: 1 FLUX = 0.021 BTC (immutable structural constant) */
export const PARITY_BTC = 0.021;

/** Parity in satoshis */
export const PARITY_SATS = 2_100_000;

/** CVF rate */
export const CVF_RATE = 0.095;

/** Creator royalty rate */
export const ROYALTY_RATE = 0.05;

/** Genesis fee in USD */
export const GENESIS_FEE_USD = 369;

/** Canonical transformation domains (9) */
export const TRANSFORMATION_DOMAINS = [
  'Origin',
  'Creation',
  'Identity',
  'Work',
  'Competency',
  'Commitment',
  'Exchange',
  'Record',
  'Recovery',
] as const;

export type TransformationDomain = typeof TRANSFORMATION_DOMAINS[number];

/**
 * Coherence classification tiers.
 * These are band labels for UI preview only.
 * Canonical classification happens on-chain at the LUX Runtime Oracle PDA.
 */
export enum Classification {
  REJECTED = 'REJECTED',
  SEED = 'SEED',
  BLOOM = 'BLOOM',
  ROOT = 'ROOT',
}

/**
 * Local calibration check result.
 * This is NOT a canonical verdict. Canonical verdicts are issued
 * on-chain by the LUX Runtime Oracle PDA only.
 */
export enum CalibrationCheck {
  PASSES_LOCAL_CALIBRATION = 'PASSES_LOCAL_CALIBRATION',
  FAILS_LOCAL_CALIBRATION = 'FAILS_LOCAL_CALIBRATION',
}
