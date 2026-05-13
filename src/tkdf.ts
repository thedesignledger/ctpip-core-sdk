/**
 * TKDF-256 - Transformation Key Derivation Function (Canonical Reference)
 * 
 * License: CC-BY-NC 4.0
 * Author: Erico Lisboa, Genesis Architect
 * Entity: Design Ledger Pty Ltd, ABN 50 669 856 339
 * Contact: designledger.co
 * Commercial use: licensed through Design Ledger Pty Ltd.
 * 
 * Canonical implementation of TKDF-256 for CTP/IP.
 * Deterministic key derivation with byte-level concatenation and
 * salt appended at end per foundational law T = Δ Σ ₀ Γ.
 */

import { createHash } from 'crypto';

/** Canonical use-case salts for TKDF-256 */
export const SALTS = {
  LOCK: "TKDF:LOCK",
  GOV: "TKDF:GOV", 
  DID: "TKDF:DID",
  LIN: "TKDF:LIN",
  ZKT: "TKDF:ZKT",
  FLX: "TKDF:FLX",
  SWP: "TKDF:SWP",
  HER: "TKDF:HER",
  DAT: "TKDF:DAT"
} as const;

/**
 * Convert number to IEEE-754 float64 big-endian bytes
 */
export function float64BE(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, value, false); // false = big-endian
  return new Uint8Array(buffer);
}

/**
 * Convert number to uint32 big-endian bytes
 */
export function uint32BE(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, value, false); // false = big-endian
  return new Uint8Array(buffer);
}

/**
 * Convert number to uint64 big-endian bytes
 */
export function uint64BE(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setBigUint64(0, BigInt(value), false); // false = big-endian
  return new Uint8Array(buffer);
}

/**
 * Canonical TKDF-256 implementation
 * 
 * Process: SHA-256(concat(inputs[0], inputs[1], ..., inputs[n], utf8(salt)))
 * 
 * @param inputs - Array of raw byte arrays to concatenate
 * @param salt - UTF-8 salt string appended at end
 * @returns 64-character hex string
 */
export function tkdf256(inputs: Uint8Array[], salt: string): string {
  // Calculate total length
  const saltBytes = new TextEncoder().encode(salt);
  const totalLength = inputs.reduce((sum, input) => sum + input.length, 0) + saltBytes.length;
  
  // Concatenate all inputs + salt
  const preimage = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const input of inputs) {
    preimage.set(input, offset);
    offset += input.length;
  }
  
  // Append salt at end
  preimage.set(saltBytes, offset);
  
  // Compute SHA-256
  const hash = createHash('sha256');
  hash.update(Buffer.from(preimage));
  return hash.digest('hex');
}

/**
 * Derive heritage hash using canonical TKDF-256
 * 
 * Used for Genesis Anchor and heritage chain verification.
 * 
 * @param evidenceHashHex - Evidence hash as hex string (64 chars)
 * @param anchorHashHex - Anchor hash as hex string (64 chars)  
 * @param gamma - Gamma value as float
 * @returns 64-character hex string
 */
export function deriveHeritage(
  evidenceHashHex: string,
  anchorHashHex: string,
  gamma: number
): string {
  const evidenceBytes = new Uint8Array(
    evidenceHashHex.match(/.{2}/g)!.map(hex => parseInt(hex, 16))
  );
  const anchorBytes = new Uint8Array(
    anchorHashHex.match(/.{2}/g)!.map(hex => parseInt(hex, 16))
  );
  const gammaBytes = float64BE(gamma);
  
  return tkdf256([evidenceBytes, anchorBytes, gammaBytes], SALTS.HER);
}

// Internal conformance test - Genesis Anchor reproduction
const GENESIS_EVIDENCE = "1ed80be5bdf906eb259b04e9331fe4ec0cb3bc01aed5dbfb0bf9016c521825ea";
const GENESIS_ANCHOR = "c68d5bb2a8759ea332f642c6758d82ebbf8f0d6826f4182103b9a81a2b8f5af8";
const GENESIS_GAMMA = 0.9497;
const EXPECTED_GENESIS_HASH = "c8041da8bbde4afe00906e6d0efb64300f90d2755b92b7835a736281fb179136";

// Run conformance test
try {
  const result = deriveHeritage(GENESIS_EVIDENCE, GENESIS_ANCHOR, GENESIS_GAMMA);
  if (result === EXPECTED_GENESIS_HASH) {
    console.log("Genesis Anchor conformance: PASS");
  } else {
    console.error(`Genesis Anchor conformance: FAIL: got ${result}`);
  }
} catch (err) {
  console.error("Genesis Anchor conformance test error:", err);
}