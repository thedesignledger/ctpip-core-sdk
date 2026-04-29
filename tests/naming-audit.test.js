/**
 * Section 0 naming audit tests.
 *
 * Verifies that the SDK does not use names that collide with
 * canonical on-chain authorities (LUX Runtime, Guardian Gates),
 * does not return CTU, and does not reference superseded DOIs.
 *
 * Copyright 2025-2026 Ãrico Lisboa / Design Ledger PTY LTD
 * License: Apache 2.0
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

function readAllSources() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.py'));
  const contents = {};
  for (const f of files) {
    contents[f] = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
  }
  return contents;
}

describe('Section 0 naming compliance', () => {
  const sources = readAllSources();

  it('should not export evaluateEVA', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('export function evaluateEVA'),
        `${file} exports evaluateEVA (renamed to estimateLocalCoherence)`);
      assert.ok(!content.includes('export { evaluateEVA'),
        `${file} re-exports evaluateEVA`);
    }
  });

  it('should not export EVAResult or EVAInput as public types', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('export interface EVAResult'),
        `${file} exports EVAResult (renamed to LocalCoherenceEstimate)`);
      assert.ok(!content.includes('export interface EVAInput'),
        `${file} exports EVAInput (renamed to CoherenceInput)`);
    }
  });

  it('should not export Verdict enum', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('export enum Verdict'),
        `${file} exports Verdict (renamed to CalibrationCheck)`);
    }
  });

  it('should not have a gates.ts file', () => {
    assert.ok(!fs.existsSync(path.join(SRC_DIR, 'gates.ts')),
      'gates.ts should be removed (Guardian Gates module removed)');
  });

  it('should not export evaluateGates or GateResult', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('evaluateGates'),
        `${file} references evaluateGates (Guardian Gates module removed)`);
      assert.ok(!content.includes('GateResult'),
        `${file} references GateResult (Guardian Gates module removed)`);
      assert.ok(!content.includes('GateEvaluation'),
        `${file} references GateEvaluation (Guardian Gates module removed)`);
    }
  });

  it('should not have ctu in output interfaces', () => {
    for (const [file, content] of Object.entries(sources)) {
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*') || line.trim().startsWith('"""')) continue;
        if (line.includes('ctu:') || line.includes('ctu =') || line.match(/\bctu\b.*number/) || line.match(/\bctu\b.*float/)) {
          assert.fail(`${file} contains ctu field: ${line.trim()}`);
        }
      }
    }
  });

  it('should not reference R11 DOI', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('10.5281/zenodo.19362640'),
        `${file} references superseded R11 DOI`);
      assert.ok(!content.includes('R11 Sealed Unified Corpus'),
        `${file} references R11 (superseded)`);
    }
  });

  it('should not have eva.ts file', () => {
    assert.ok(!fs.existsSync(path.join(SRC_DIR, 'eva.ts')),
      'eva.ts should be renamed to coherence.ts');
  });

  it('should reference R2/R22 or R1 DOI only', () => {
    for (const [file, content] of Object.entries(sources)) {
      assert.ok(!content.includes('10.5281/zenodo.19847990'),
        `${file} references pending R2 DOI (not minted yet)`);
    }
  });
});

describe('README compliance', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

  it('should have non-authoritative banner', () => {
    assert.ok(readme.includes('Non-authoritative reference'),
      'README missing non-authoritative banner');
  });

  it('should list canonical authority addresses', () => {
    assert.ok(readme.includes('YvxS7U37b5369xzNXt1EEuXjEkp65Ngcq9NsGUr3bmZ'),
      'README missing program address');
    assert.ok(readme.includes('8QTfNKF66N2uov4MfduioEjfaA6Hi8YBe8Lztoyxnzrk'),
      'README missing LUX Runtime Oracle PDA');
    assert.ok(readme.includes('Dun6pP3Xsx9CWetKj3zd8iqHz8EYC1amYSeJKG8JzQ9n'),
      'README missing FLUX Mint');
  });

  it('should not reference R11', () => {
    assert.ok(!readme.includes('R11'),
      'README references R11 (superseded)');
  });

  it('should not reference SE-SPEC', () => {
    assert.ok(!readme.includes('SE-SPEC'),
      'README references SE-SPEC (not a published document)');
  });

  it('should not have Level 0 Invariants section', () => {
    assert.ok(!readme.includes('Level 0 Invariants'),
      'README has Level 0 Invariants section (should be Protocol Constants Reference Only)');
  });

  it('should have Protocol Constants (Reference Only) section', () => {
    assert.ok(readme.includes('Protocol Constants (Reference Only)'),
      'README missing Protocol Constants (Reference Only) section');
  });

  it('should not reference superseded DOI', () => {
    assert.ok(!readme.includes('10.5281/zenodo.19362640'),
      'README references superseded R11 DOI');
  });

  it('should not have Guardian Gates in module table', () => {
    assert.ok(!readme.includes('Guardian Gates'),
      'README references Guardian Gates module (removed)');
  });
});

describe('package.json compliance', () => {
  const pkg = require('../package.json');

  it('should be version 0.1.0', () => {
    assert.equal(pkg.version, '0.1.0');
  });

  it('should have non-authoritative in description', () => {
    assert.ok(pkg.description.includes('Non-authoritative'),
      'package.json description missing non-authoritative framing');
  });

  it('should not have lux-runtime keyword', () => {
    assert.ok(!pkg.keywords.includes('lux-runtime'),
      'package.json has lux-runtime keyword');
  });

  it('should not have guardian-gates keyword', () => {
    assert.ok(!pkg.keywords.includes('guardian-gates'),
      'package.json has guardian-gates keyword');
  });

  it('should not have proof-of-transformation keyword', () => {
    assert.ok(!pkg.keywords.includes('proof-of-transformation'),
      'package.json has proof-of-transformation keyword');
  });
});

