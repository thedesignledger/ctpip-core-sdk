/**
 * CTP/IP Core SDK
 *
 * Portable physics engine for the Causal Time Protocol.
 *
 * Contains:
 * - Canonical constants (Book I-II)
 * - LUX Runtime (coherence validation)
 * - Guardian Gates (pre-validation enforcement)
 * - TKDF-256 (causal key derivation)
 * - Welford variance (calibration statistics)
 *
 * Source: CTP/IP canonical corpus (sealed, DOI: 10.5281/zenodo.20652928)
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
  CVF_RATE,
  ROYALTY_RATE,
  GENESIS_FEE_USD,
  TRANSFORMATION_DOMAINS,
  Classification,
  Verdict,
} from './constants';
export type { TransformationDomain } from './constants';

// LUX Runtime
export {
  computeGamma,
  computeCTU,
  classify,
  computeTemporalDebt,
  computeAttention,
  evaluateEVA,
} from './eva';
export type { EVAInput, EVAResult } from './eva';

// Guardian Gates
export { evaluateGates } from './gates';
export type { CausalAnchor, SealAttempt, GateResult, GateEvaluation } from './gates';

// TKDF-256
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
export type { WelfordState, EVACalibration } from './welford';
