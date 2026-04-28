/**
 * @ctpip/core - Non-Authoritative Reference SDK
 *
 * This package cannot produce a valid Seal, mint CTU, or sign
 * on-chain transformations. It exposes the calibration math and
 * TKDF-256 algorithm of CTP/IP for UI preview, local development,
 * agent verification, and protocol study only.
 *
 * Canonical authority lives on Solana mainnet:
 * - Program: YvxS7U37b5369xzNXt1EEuXjEkp65Ngcq9NsGUr3bmZ
 * - LUX Runtime Oracle PDA: 8QTfNKF66N2uov4MfduioEjfaA6Hi8YBe8Lztoyxnzrk
 * - FLUX Mint: Dun6pP3Xsx9CWetKj3zd8iqHz8EYC1amYSeJKG8JzQ9n
 *
 * Canonical specification: CTP/IP (R2 / operative R22).
 * Historical R1 record at DOI 10.5281/zenodo.18795109.
 * R2 publication forthcoming.
 *
 * Copyright 2025-2026 Erico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 *
 * @module @ctpip/core
 */

// Constants
export {
  PHI,
  LAMBDA_LUX,
  EPSILON_0,
  GAMMA_MIN,
  GAMMA_BLOOM,
  GAMMA_ROOT,
  ALPHA_DEFAULT,
  PARITY_BTC,
  PARITY_SATS,
  CVF_RATE,
  ROYALTY_RATE,
  GENESIS_FEE_USD,
  TRANSFORMATION_DOMAINS,
  Classification,
  CalibrationCheck,
} from './constants';
export type { TransformationDomain } from './constants';

// Coherence Estimation (local, non-authoritative)
export {
  computeGamma,
  classify,
  computeTemporalDebt,
  computeAttention,
  estimateLocalCoherence,
} from './coherence';
export type { CoherenceInput, LocalCoherenceEstimate } from './coherence';

// TKDF-256 (open public-standard cryptographic primitive)
export {
  TKDF_SALTS,
  deriveTKDF256,
  deriveSealHash,
  deriveIntentSig,
} from './tkdf';
export type { TKDFInput } from './tkdf';

// Welford Variance / Calibration
export {
  welfordInit,
  welfordUpdate,
  welfordVariance,
  welfordSampleVariance,
  welfordStdDev,
  calibrationInit,
  calibrationRecord,
  calibrationReady,
  calibrationFingerprint,
} from './welford';
export type { WelfordState, CoherenceCalibration } from './welford';
