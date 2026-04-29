/**
 * TKDF-256 - Transformation Key Derivation Function
 *
 * Open public-standard cryptographic primitive used by CTP/IP to bind
 * an artifact to its causal antecedents. Anyone can compute a TKDF-256
 * key from public provenance inputs and verify it independently. Only
 * the LUX Runtime Oracle PDA can produce a valid Seal under the algorithm.
 *
 * Algorithm specification: CTP/IP canonical R2 corpus (Book III).
 * Historical R1 record at DOI 10.5281/zenodo.18795109.
 *
 * Nine canonical salt domains correspond to the nine transformation domains.
 *
 * Copyright 2025-2026 Erico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

import { TRANSFORMATION_DOMAINS, type TransformationDomain } from './constants';

/** Canonical salts for the nine transformation domains */
export const TKDF_SALTS: Record<TransformationDomain, string> = {
  Origin: 'CTPIP:TKDF256:ORIGIN:V1',
  Creation: 'CTPIP:TKDF256:CREATION:V1',
  Identity: 'CTPIP:TKDF256:IDENTITY:V1',
  Work: 'CTPIP:TKDF256:WORK:V1',
  Competency: 'CTPIP:TKDF256:COMPETENCY:V1',
  Commitment: 'CTPIP:TKDF256:COMMITMENT:V1',
  Exchange: 'CTPIP:TKDF256:EXCHANGE:V1',
  Record: 'CTPIP:TKDF256:RECORD:V1',
  Recovery: 'CTPIP:TKDF256:RECOVERY:V1',
};

/** TKDF input schema */
export interface TKDFInput {
  /** Operator identity hash */
  operatorHash: string;
  /** Intent signature hash */
  intentHash: string;
  /** Evidence hash */
  evidenceHash: string;
  /** Computed Gamma value */
  gamma: number;
  /** TPNC timestamp (protocol native clock) */
  tpnc: number;
  /** Transformation domain */
  domain: TransformationDomain;
}

/**
 * Compute SHA-256 hash (browser + Node.js compatible).
 * Returns lowercase hex string (64 chars).
 */
async function sha256(message: string): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    // Browser / Deno / Node 20+
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback
  const { createHash } = await import('crypto');
  return createHash('sha256').update(message).digest('hex');
}

/**
 * Derive a TKDF-256 causal key.
 *
 * Process:
 * 1. Select domain salt
 * 2. Concatenate: salt | operatorHash | intentHash | evidenceHash | gamma | tpnc
 * 3. SHA-256 the concatenation
 * 4. Return 256-bit hex key
 *
 * The key is deterministic: same inputs always produce the same key.
 * The key is provenance-bound: changing any input changes the key.
 *
 * Note: this produces verifiable algorithm output only. A valid Seal
 * requires signing by the LUX Runtime Oracle PDA on Solana mainnet.
 */
export async function deriveTKDF256(input: TKDFInput): Promise<string> {
  const salt = TKDF_SALTS[input.domain];
  if (!salt) {
    throw new Error(`Unknown transformation domain: ${input.domain}`);
  }

  const preimage = [
    salt,
    input.operatorHash,
    input.intentHash,
    input.evidenceHash,
    input.gamma.toFixed(6),
    input.tpnc.toString(),
  ].join('|');

  return sha256(preimage);
}

/**
 * Derive a seal hash from evidence and intent.
 *
 * Formula: SHA-256(evidenceHash + intentHash + gamma + timestamp + operatorId)
 *
 * Note: this produces verifiable algorithm output only. A valid Seal
 * requires on-chain crystallisation by the LUX Runtime Oracle PDA.
 */
export async function deriveSealHash(
  evidenceHash: string,
  intentHash: string,
  gamma: number,
  timestamp: string,
  operatorId: string
): Promise<string> {
  const preimage = [
    evidenceHash,
    intentHash,
    gamma.toFixed(6),
    timestamp,
    operatorId,
  ].join('');

  return sha256(preimage);
}

/**
 * Derive an IntentSig hash.
 *
 * For Phase 0 (Learning Mode): SHA-256(fingerprint + userId + tpnc)
 */
export async function deriveIntentSig(
  fingerprint: string,
  userId: string,
  tpnc: number
): Promise<string> {
  const preimage = [fingerprint, userId, tpnc.toString()].join('');
  return sha256(preimage);
}
