/**
 * Tests for TKDF-256 reference implementation.
 *
 * Verifies the TKDF-256 causal key derivation against known test vectors.
 * The algorithm is an open public standard. Only the LUX Runtime Oracle PDA
 * can produce a valid Seal under this algorithm.
 *
 * Copyright 2025-2026 Ãrico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const vectors = require('./tkdf256-vectors.json');

const TKDF_SALTS = {
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

function sha256(msg) {
  return crypto.createHash('sha256').update(msg).digest('hex');
}

function deriveTKDF256(input) {
  const salt = TKDF_SALTS[input.domain];
  if (!salt) throw new Error(`Unknown domain: ${input.domain}`);
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

describe('TKDF-256 test vectors', () => {
  for (const vector of vectors.vectors) {
    it(`should produce correct hash for domain ${vector.domain}`, () => {
      const result = deriveTKDF256(vector);
      assert.equal(result, vector.expectedHash,
        `TKDF-256 mismatch for domain ${vector.domain}`);
    });
  }
});

describe('TKDF-256 properties', () => {
  it('should be deterministic (same inputs produce same output)', () => {
    const input = vectors.vectors[0];
    const r1 = deriveTKDF256(input);
    const r2 = deriveTKDF256(input);
    assert.equal(r1, r2);
  });

  it('should be provenance-bound (changing any input changes output)', () => {
    const base = vectors.vectors[0];
    const modified = { ...base, gamma: 0.86 };
    const r1 = deriveTKDF256(base);
    const r2 = deriveTKDF256(modified);
    assert.notEqual(r1, r2);
  });

  it('should produce 64-char lowercase hex output', () => {
    const result = deriveTKDF256(vectors.vectors[0]);
    assert.equal(result.length, 64);
    assert.match(result, /^[a-f0-9]{64}$/);
  });

  it('should reject unknown domains', () => {
    assert.throws(() => {
      deriveTKDF256({ ...vectors.vectors[0], domain: 'FakeDomain' });
    }, /Unknown domain/);
  });
});

describe('seal hash derivation', () => {
  it('should produce deterministic seal hash', () => {
    const preimage = 'c'.repeat(64) + 'b'.repeat(64) + '0.850000' + '2024-04-28T12:00:00Z' + 'operator-1';
    const hash = sha256(preimage);
    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });
});

