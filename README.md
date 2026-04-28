# @ctpip/core

> **Non-authoritative reference.** This package cannot produce a valid
> Seal, mint CTU, or sign on-chain transformations. It exposes the
> calibration math and TKDF-256 algorithm of CTP/IP for UI preview,
> local development, agent verification, and protocol study only.
>
> **Canonical authority lives on Solana mainnet:**
> - Program: `YvxS7U37b5369xzNXt1EEuXjEkp65Ngcq9NsGUr3bmZ`
> - LUX Runtime Oracle PDA: `8QTfNKF66N2uov4MfduioEjfaA6Hi8YBe8Lztoyxnzrk`
> - FLUX Mint: `Dun6pP3Xsx9CWetKj3zd8iqHz8EYC1amYSeJKG8JzQ9n`
>
> Any value produced by this SDK is a local estimate or a verifiable
> algorithm output only - never a canonical Seal.

Non-authoritative reference SDK for the **Causal Time Protocol / Intentional Processing (CTP/IP)**.

Canonical specification: CTP/IP (R2 / operative R22). Historical R1 record at DOI [10.5281/zenodo.18795109](https://doi.org/10.5281/zenodo.18795109). R2 publication forthcoming.

Available in TypeScript and Python.

## What This Contains

| Module | Purpose |
|:-------|:--------|
| **Constants** | PHI, thresholds, Parity Law, domains (reference only) |
| **Coherence Estimation** | Local gamma estimation, classification preview, calibration check |
| **TKDF-256** | Causal key derivation from provenance inputs (open public standard) |
| **Welford** | Online variance for calibration fingerprinting |

## Install

```bash
# TypeScript
npm install @ctpip/core

# Python
pip install ctpip-core
```

## Quick Start (TypeScript)

```typescript
import { estimateLocalCoherence, CalibrationCheck, Classification } from '@ctpip/core';

// Compute a LOCAL coherence estimate (not a Seal)
const estimate = estimateLocalCoherence({ E: 0.85, V: 0.90, A: 0.88, tau: 0 });

console.log(estimate.gammaEstimate);        // 0.6732 (local preview)
console.log(estimate.classificationPreview); // SEED (band label)
console.log(estimate.calibrationCheck);      // PASSES_LOCAL_CALIBRATION

// Note: this is a local estimate. To produce a canonical Seal,
// submit a transformation to the LUX Runtime Oracle PDA on Solana
// mainnet via the canonical authority.
```

## Quick Start (Python)

```python
from ctpip_core import estimate_local_coherence, CoherenceInput, CalibrationCheck

# Compute a LOCAL coherence estimate (not a Seal)
estimate = estimate_local_coherence(CoherenceInput(E=0.85, V=0.90, A=0.88, tau=0))

print(estimate.gamma_estimate)         # 0.6732 (local preview)
print(estimate.classification_preview) # SEED (band label)
print(estimate.calibration_check)      # PASSES_LOCAL_CALIBRATION

# Note: this is a local estimate. To produce a canonical Seal,
# submit a transformation to the LUX Runtime Oracle PDA on Solana
# mainnet via the canonical authority.
```

## The One Law

```
T = Delta-Sigma-Zero-Gamma
```

Time is generated only when irreversible transformation occurs under declared intent, measurable energetic cost, and validated coherence.

## Protocol Constants (Reference Only)

These constants are exposed for reference and local calibration. Enforcement of protocol invariants -- including the AI Boundary (w_AI = 0), EVA Lock, Anti-Circularity, and Binary Validation -- happens on-chain at the canonical authority. This SDK does not and cannot enforce them.

| Constant | Value | Description |
|:---------|:------|:------------|
| PHI | 1.618033988749895 | Golden Ratio |
| GAMMA_MIN | 0.70 | SEED coherence threshold (Carnot) |
| GAMMA_BLOOM | 0.8187 | BLOOM coherence threshold (Landauer) |
| GAMMA_ROOT | 0.95 | ROOT coherence threshold (relativistic) |
| EPSILON_0 | 1.0 | Stability constant |
| PARITY_BTC | 0.021 | 1 FLUX = 0.021 BTC |

## TKDF-256 - Causal Key Derivation Function

TKDF-256 is the open standard cryptographic primitive used by CTP/IP to bind an artifact to its causal antecedents. Anyone can compute a TKDF-256 key from public provenance inputs and verify it independently. Only the LUX Runtime Oracle PDA can produce a valid Seal under the algorithm.

This SDK ships a reference implementation in TypeScript and Python. Test vectors are in `tests/tkdf256-vectors.json`.

The algorithm specification is in the canonical R2 corpus (Book III).

## License

Apache 2.0

## Links

- Product: [sealed.energy](https://sealed.energy)
- Commercial: [designledger.co](https://designledger.co)
- Historical R1 corpus: [DOI 10.5281/zenodo.18795109](https://doi.org/10.5281/zenodo.18795109)
- Standards: [time.foundation](https://time.foundation)
- Source: [github.com/thedesignledger](https://github.com/thedesignledger)

Copyright 2025-2026 Érico Lisboa / Design Ledger PTY LTD (ABN 50 669 856 339)
