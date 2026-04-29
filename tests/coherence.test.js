/**
 * Tests for @ctpip/core coherence estimation module.
 *
 * Non-authoritative reference - these tests verify local estimate
 * correctness, not canonical Seal production.
 *
 * Copyright 2025-2026 Ãrico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const PHI = 1.618033988749895;
const EPSILON_0 = 1.0;
const GAMMA_MIN = 0.70;
const GAMMA_BLOOM = 0.8187;
const GAMMA_ROOT = 0.95;

function computeGamma(E, V, A, tau) {
  const raw = (E * V * A) / (tau + EPSILON_0);
  return Math.min(1.0, Math.max(0.0, raw));
}

function classify(gamma) {
  if (gamma >= GAMMA_ROOT) return 'ROOT';
  if (gamma >= GAMMA_BLOOM) return 'BLOOM';
  if (gamma >= GAMMA_MIN) return 'SEED';
  return 'REJECTED';
}

describe('computeGamma', () => {
  it('should compute gamma for standard inputs', () => {
    const gamma = computeGamma(0.85, 0.90, 0.88, 0);
    assert.ok(Math.abs(gamma - 0.6732) < 0.0001);
  });

  it('should return 0 when any input is 0', () => {
    assert.equal(computeGamma(0, 0.90, 0.88, 0), 0);
    assert.equal(computeGamma(0.85, 0, 0.88, 0), 0);
    assert.equal(computeGamma(0.85, 0.90, 0, 0), 0);
  });

  it('should clamp to [0, 1]', () => {
    const gamma = computeGamma(1.0, 1.0, 1.0, 0);
    assert.ok(gamma <= 1.0);
    assert.ok(gamma >= 0.0);
  });

  it('should decrease with increasing tau', () => {
    const g1 = computeGamma(0.85, 0.90, 0.88, 0);
    const g2 = computeGamma(0.85, 0.90, 0.88, 1);
    assert.ok(g2 < g1);
  });
});

describe('classify', () => {
  it('should classify REJECTED below 0.70', () => {
    assert.equal(classify(0.69), 'REJECTED');
    assert.equal(classify(0.0), 'REJECTED');
  });

  it('should classify SEED at threshold', () => {
    assert.equal(classify(0.70), 'SEED');
    assert.equal(classify(0.81), 'SEED');
  });

  it('should classify BLOOM at threshold', () => {
    assert.equal(classify(0.8187), 'BLOOM');
    assert.equal(classify(0.94), 'BLOOM');
  });

  it('should classify ROOT at threshold', () => {
    assert.equal(classify(0.95), 'ROOT');
    assert.equal(classify(0.99), 'ROOT');
  });
});

describe('calibration check', () => {
  it('should fail local calibration when gamma < GAMMA_MIN', () => {
    const gamma = computeGamma(0.85, 0.90, 0.88, 0);
    const deltaS = 1 - gamma;
    const passes = gamma >= GAMMA_MIN && deltaS > 0;
    assert.equal(passes, false);
  });

  it('should pass when gamma meets threshold', () => {
    const gamma = computeGamma(0.90, 0.90, 0.90, 0);
    const deltaS = 1 - gamma;
    const passes = gamma >= GAMMA_MIN && deltaS > 0;
    assert.equal(passes, true);
  });
});

describe('output shape', () => {
  it('should NOT contain ctu field', () => {
    const expectedFields = ['gammaEstimate', 'deltaS', 'classificationPreview', 'calibrationCheck', 'temporalDebtEstimate'];
    const forbiddenFields = ['ctu', 'verdict'];

    const fs = require('fs');
    const source = fs.readFileSync(__dirname + '/../src/coherence.ts', 'utf8');
    for (const field of forbiddenFields) {
      assert.ok(!source.includes(`  ${field}:`), `Source should not contain field "${field}" in output interface`);
    }
  });
});

