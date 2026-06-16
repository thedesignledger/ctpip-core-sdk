/**
 * CTP/IP Canonical Constants
 * Source: CTP/IP canonical corpus (sealed, DOI: 10.5281/zenodo.20652928)
 * Book I S.I.6, Book II S.II.2
 *
 * These values are IMMUTABLE. Do not modify.
 * The law is immutable. The thresholds are refinable only by
 * the Validation Council per Book IV Part B.
 */

/** Golden Ratio - temporal scaling constant (Book I S.I.6.2) */
export const PHI = 1.618033988749895;

/** Lux Limit - upper bound of causal energy density (Book I S.I.6.1) */
export const LAMBDA_LUX = 8.98755178736818e16;

/** Stability constant - division-by-zero guard (Book II S.II.4.1) */
export const EPSILON_0 = 1.0;

/** SEED threshold - Carnot efficiency limit (Book II S.II.4.2) */
export const GAMMA_MIN = 0.70;

/** BLOOM threshold - Landauer erasure limit (Book II S.II.4.2) */
export const GAMMA_BLOOM = 0.8187;

/** ROOT threshold - relativistic coherence (Book II S.II.4.2) */
export const GAMMA_ROOT = 0.95;

/** Default ALPHA for attention computation */
export const ALPHA_DEFAULT = 8.0;

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

/** Coherence classification tiers */
export enum Classification {
  REJECTED = 'REJECTED',
  SEED = 'SEED',
  BLOOM = 'BLOOM',
  ROOT = 'ROOT',
}

/** EVA verdict */
export enum Verdict {
  VALID = 'VALID',
  INVALID = 'INVALID',
}
