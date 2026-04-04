# @ctpip/core

Portable physics engine for the **Causal Time Protocol / Intentional Processing (CTP/IP)**.

This SDK implements the canonical protocol specification from the R11 Sealed Unified Corpus (DOI: 10.5281/zenodo.19362640). Available in TypeScript and Python.

## What This Contains

| Module | Purpose | R11 Reference |
|:-------|:--------|:-------------|
| **Constants** | PHI, thresholds, Parity Law, domains | Book I S.I.6, Book II S.II.2 |
| **EVA Engine** | Gamma computation, CTU generation, classification | Book II S.II.6, Book III S.III.A.3.3 |
| **Guardian Gates** | Five-gate pre-validation enforcement | Book III S.III.A.3.4 |
| **TKDF-256** | Causal key derivation from provenance inputs | SE-SPEC 2.1 Part XII |
| **Welford** | Online variance for calibration fingerprinting | Book IV S.IV.A.3.00 |

## Install

```bash
# TypeScript
npm install @ctpip/core

# Python
pip install ctpip-core
```

## Quick Start (TypeScript)

```typescript
import { evaluateEVA, evaluateGates, Classification, Verdict } from '@ctpip/core';

// Compute coherence
const result = evaluateEVA({ E: 0.85, V: 0.90, A: 0.88, tau: 0 });
console.log(result.gamma);          // 0.6732
console.log(result.classification); // SEED
console.log(result.verdict);        // VALID
console.log(result.ctu);            // 1.0929...

// Full gate evaluation
const gates = evaluateGates({
  intentHash: 'a'.repeat(64),
  evidenceHash: 'b'.repeat(64),
  anchors: [{ anchorId: '1', anchorType: 'wallet', anchorStatus: 'Linked' }],
  eva: { E: 0.85, V: 0.90, A: 0.88, tau: 0 },
  aiOriginated: false,
});
console.log(gates.allPassed); // true
```

## Quick Start (Python)

```python
from ctpip_core import evaluate_eva, evaluate_gates, EVAInput, CausalAnchor

# Compute coherence
result = evaluate_eva(EVAInput(E=0.85, V=0.90, A=0.88, tau=0))
print(result.gamma)           # 0.6732
print(result.classification)  # SEED
print(result.verdict)         # VALID

# Full gate evaluation
gates = evaluate_gates(
    intent_hash='a' * 64,
    evidence_hash='b' * 64,
    anchors=[CausalAnchor('1', 'wallet', 'Linked')],
    eva_input=EVAInput(E=0.85, V=0.90, A=0.88),
)
print(gates.all_passed)  # True
```

## The One Law

```
T = Delta-Sigma-Zero-Gamma
```

Time is generated only when irreversible transformation occurs under declared intent, measurable energetic cost, and validated coherence.

## Canonical Constants

| Constant | Value | Source |
|:---------|:------|:-------|
| PHI | 1.618033988749895 | Golden Ratio |
| GAMMA_MIN | 0.70 | SEED threshold (Carnot) |
| GAMMA_BLOOM | 0.8187 | BLOOM threshold (Landauer) |
| GAMMA_ROOT | 0.95 | ROOT threshold (relativistic) |
| EPSILON_0 | 1.0 | Stability constant |
| PARITY_BTC | 0.021 | 1 FLUX = 0.021 BTC |

## Level 0 Invariants (Never Violate)

1. **EVA Lock** - No CTU without EVA validation
2. **Anti-Circularity** - No system validates its own output
3. **Binary Validation** - VALID or INVALID only
4. **AI Boundary** - w_AI = 0 (AI earns zero CTU weight)

## License

Apache 2.0

## Links

- Protocol: [designledger.co](https://designledger.co)
- Corpus: [DOI 10.5281/zenodo.19362640](https://doi.org/10.5281/zenodo.19362640)
- Standards: [time.foundation](https://time.foundation)
- Source: [github.com/thedesignledger](https://github.com/thedesignledger)

Copyright 2025-2026 Érico Lisboa / Design Ledger PTY LTD (ABN 50 669 856 339)
