"""
CTP/IP Core SDK - Python Implementation (Canonical TKDF-256)

License: CC-BY-NC 4.0
Author: Erico Lisboa, Genesis Architect
Entity: Design Ledger Pty Ltd, ABN 50 669 856 339
Contact: designledger.co
Commercial use: licensed through Design Ledger Pty Ltd.

Canonical implementation of TKDF-256 for CTP/IP with byte-level concatenation
and salt appended at end per foundational law T = Δ Σ ₀ Γ.
"""

import hashlib
import math
import re
import struct
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List

# ===========================================================================
# CANONICAL CONSTANTS (IMMUTABLE)
# Source: R11 Book I S.I.6, Book II S.II.2
# ===========================================================================

PHI = 1.618033988749895
"""Golden Ratio - temporal scaling constant (Book I S.I.6.2)"""

LAMBDA_LUX = 8.98755178736818e16
"""Lux Limit - upper bound of causal energy density (Book I S.I.6.1)"""

EPSILON_0 = 1.0
"""Stability constant - division-by-zero guard (Book II S.II.4.1)"""

GAMMA_MIN = 0.70
"""SEED threshold - Carnot efficiency limit (Book II S.II.4.2)"""

GAMMA_BLOOM = 0.8187
"""BLOOM threshold - Landauer erasure limit (Book II S.II.4.2)"""

GAMMA_ROOT = 0.95
"""ROOT threshold - relativistic coherence (Book II S.II.4.2)"""

ALPHA_DEFAULT = 8.0
"""Default ALPHA for attention computation"""

PARITY_BTC = 0.021
"""Parity Law: 1 FLUX = 0.021 BTC"""

PARITY_SATS = 2_100_000
"""Parity in satoshis"""

CVF_RATE = 0.095
"""Coherence Value Fee rate"""

ROYALTY_RATE = 0.05
"""Creator royalty rate"""

GENESIS_FEE_USD = 369
"""Genesis fee in USD"""

TRANSFORMATION_DOMAINS = (
    "Origin", "Creation", "Identity", "Work", "Competency",
    "Commitment", "Exchange", "Record", "Recovery",
)
"""Canonical 9 transformation domains"""


class Classification(Enum):
    REJECTED = "REJECTED"
    SEED = "SEED"
    BLOOM = "BLOOM"
    ROOT = "ROOT"


class Verdict(Enum):
    VALID = "VALID"
    INVALID = "INVALID"


# ===========================================================================
# CANONICAL TKDF-256 IMPLEMENTATION
# ===========================================================================

# Canonical use-case salts for TKDF-256
SALTS = {
    "LOCK": "TKDF:LOCK",
    "GOV": "TKDF:GOV", 
    "DID": "TKDF:DID",
    "LIN": "TKDF:LIN",
    "ZKT": "TKDF:ZKT",
    "FLX": "TKDF:FLX",
    "SWP": "TKDF:SWP",
    "HER": "TKDF:HER",
    "DAT": "TKDF:DAT"
}

def float64_be(value: float) -> bytes:
    """Convert number to IEEE-754 float64 big-endian bytes"""
    return struct.pack(">d", value)

def uint32_be(value: int) -> bytes:
    """Convert number to uint32 big-endian bytes"""
    return struct.pack(">I", value)

def uint64_be(value: int) -> bytes:
    """Convert number to uint64 big-endian bytes"""
    return struct.pack(">Q", value)

def tkdf256(inputs: List[bytes], salt: str) -> str:
    """
    Canonical TKDF-256 implementation
    
    Process: SHA-256(concat(inputs[0], inputs[1], ..., inputs[n], utf8(salt)))
    
    Args:
        inputs: List of raw byte arrays to concatenate
        salt: UTF-8 salt string appended at end
    
    Returns:
        64-character hex string
    """
    # Calculate total length
    salt_bytes = salt.encode('utf-8')
    total_length = sum(len(input_bytes) for input_bytes in inputs) + len(salt_bytes)
    
    # Concatenate all inputs + salt
    preimage = bytearray(total_length)
    offset = 0
    
    for input_bytes in inputs:
        preimage[offset:offset+len(input_bytes)] = input_bytes
        offset += len(input_bytes)
    
    # Append salt at end
    preimage[offset:offset+len(salt_bytes)] = salt_bytes
    
    # Compute SHA-256
    return hashlib.sha256(preimage).hexdigest()

def derive_heritage(evidence_hash_hex: str, anchor_hash_hex: str, gamma: float) -> str:
    """
    Derive heritage hash using canonical TKDF-256
    
    Used for Genesis Anchor and heritage chain verification.
    
    Args:
        evidence_hash_hex: Evidence hash as hex string (64 chars)
        anchor_hash_hex: Anchor hash as hex string (64 chars)  
        gamma: Gamma value as float
    
    Returns:
        64-character hex string
    """
    evidence_bytes = bytes.fromhex(evidence_hash_hex)
    anchor_bytes = bytes.fromhex(anchor_hash_hex)
    gamma_bytes = float64_be(gamma)
    
    return tkdf256([evidence_bytes, anchor_bytes, gamma_bytes], SALTS["HER"])

def derive_seal(intent_sig_hex: str, evidence_hex: str, gamma: float, anchor_hex: str) -> str:
    """
    Derive seal hash using canonical TKDF-256
    
    Args:
        intent_sig_hex: Intent signature hash as hex string
        evidence_hex: Evidence hash as hex string
        gamma: Gamma value as float
        anchor_hex: Anchor hash as hex string
    
    Returns:
        64-character hex string
    """
    intent_bytes = bytes.fromhex(intent_sig_hex)
    evidence_bytes = bytes.fromhex(evidence_hex)
    gamma_bytes = float64_be(gamma)
    anchor_bytes = bytes.fromhex(anchor_hex)
    
    return tkdf256([intent_bytes, evidence_bytes, gamma_bytes, anchor_bytes], SALTS["DAT"])


# ===========================================================================
# CONFORMANCE TEST
# ===========================================================================

# Internal conformance test - Genesis Anchor reproduction
GENESIS_EVIDENCE = "1ed80be5bdf906eb259b04e9331fe4ec0cb3bc01aed5dbfb0bf9016c521825ea"
GENESIS_ANCHOR = "c68d5bb2a8759ea332f642c6758d82ebbf8f0d6826f4182103b9a81a2b8f5af8"
GENESIS_GAMMA = 0.9497
EXPECTED_GENESIS_HASH = "c8041da8bbde4afe00906e6d0efb64300f90d2755b92b7835a736281fb179136"

# Run conformance test
try:
    result = derive_heritage(GENESIS_EVIDENCE, GENESIS_ANCHOR, GENESIS_GAMMA)
    if result == EXPECTED_GENESIS_HASH:
        print("Genesis Anchor conformance: PASS")
    else:
        print(f"Genesis Anchor conformance: FAIL: got {result}")
except Exception as err:
    print(f"Genesis Anchor conformance test error: {err}")


# ===========================================================================
# EVA ENGINE
# Source: Book II S.II.6, Book III S.III.A.3.3
# ===========================================================================

@dataclass
class EVAInput:
    """Raw EVA inputs."""
    E: float  # Energy commitment [0, 1]
    V: float  # Vector alignment [0, 1]
    A: float  # Attention persistence [0, 1]
    tau: float = 0.0  # Temporal friction [0, inf)


@dataclass
class EVAResult:
    """LUX Runtime output."""
    gamma: float
    ctu: float
    delta_s: float
    classification: Classification
    verdict: Verdict
    temporal_debt: float


def compute_gamma(inp: EVAInput) -> float:
    """Gamma = (E * V * A) / (tau + epsilon_0). Book I S.I.7.1."""
    raw = (inp.E * inp.V * inp.A) / (inp.tau + EPSILON_0)
    return min(1.0, max(0.0, raw))


def compute_ctu(E: float, V: float, A: float) -> float:
    """CTU = phi * E * V * A. Book II S.II.5.1."""
    return PHI * E * V * A


def classify(gamma: float) -> Classification:
    """Classify gamma into coherence tiers. Book II S.II.4.2."""
    if gamma >= GAMMA_ROOT:
        return Classification.ROOT
    if gamma >= GAMMA_BLOOM:
        return Classification.BLOOM
    if gamma >= GAMMA_MIN:
        return Classification.SEED
    return Classification.REJECTED


def compute_temporal_debt(gamma: float, V: float, E: float, A: float) -> float:
    """D = (V * E * A) / (Gamma + epsilon_0). V10 canonical."""
    if gamma >= GAMMA_MIN:
        return 0.0
    return (V * E * A) / (gamma + EPSILON_0)


def compute_attention(gamma_variance: float, alpha: float = ALPHA_DEFAULT) -> float:
    """A = 1 / (1 + alpha * sigma^2). Book VI S.VI.B.3."""
    return 1.0 / (1.0 + alpha * gamma_variance)


def evaluate_eva(inp: EVAInput) -> EVAResult:
    """
    Full LUX Runtime validation. O(1) per PoT (Theorem 5).

    Deterministic. Side-effect free. Non-participating. Binary.
    """
    E = min(1.0, max(0.0, inp.E))
    V = min(1.0, max(0.0, inp.V))
    A = min(1.0, max(0.0, inp.A))
    tau = max(0.0, inp.tau)

    gamma = compute_gamma(EVAInput(E, V, A, tau))
    delta_s = 1.0 - gamma
    classification = classify(gamma)
    verdict = Verdict.VALID if (gamma >= GAMMA_MIN and delta_s > 0) else Verdict.INVALID
    ctu = compute_ctu(E, V, A) if verdict == Verdict.VALID else 0.0
    debt = compute_temporal_debt(gamma, V, E, A) if verdict == Verdict.INVALID else 0.0

    return EVAResult(
        gamma=gamma, ctu=ctu, delta_s=delta_s,
        classification=classification, verdict=verdict, temporal_debt=debt,
    )


# ===========================================================================
# GUARDIAN GATES
# Source: Book III S.III.A.3.4
# ===========================================================================

SHA256_RE = re.compile(r"^[a-f0-9]{64}$", re.IGNORECASE)


@dataclass
class CausalAnchor:
    anchor_id: str
    anchor_type: str
    anchor_status: str  # "Linked", "Revoked", "Expired"
    anchor_gamma: Optional[float] = None


@dataclass
class GateResult:
    gate: str
    order: int
    passed: bool
    reason: Optional[str] = None


@dataclass
class GateEvaluation:
    all_passed: bool
    gates: list
    first_failure: Optional[GateResult]
    gamma: float
    clamped_gamma: float


def evaluate_gates(
    intent_hash: str,
    evidence_hash: str,
    anchors: list,
    eva_input: EVAInput,
    ai_originated: bool = False,
) -> GateEvaluation:
    """Evaluate all Five Guardian Gates. Cheapest first. All must pass."""
    gates = []

    # Pre-gate: AI Boundary
    if ai_originated:
        g = GateResult("AI Boundary", 0, False, "AI cannot originate IntentSig (w_AI = 0)")
        gates.append(g)
        return GateEvaluation(False, gates, g, 0.0, 0.0)

    # Gate 1: Intent
    g1 = GateResult("Intent", 1, bool(SHA256_RE.match(intent_hash)),
                     None if SHA256_RE.match(intent_hash) else "IntentSig hash missing or malformed")
    gates.append(g1)
    if not g1.passed:
        return GateEvaluation(False, gates, g1, 0.0, 0.0)

    # Gate 2: Evidence
    g2 = GateResult("Evidence", 2, bool(SHA256_RE.match(evidence_hash)),
                     None if SHA256_RE.match(evidence_hash) else "Evidence hash missing or malformed")
    gates.append(g2)
    if not g2.passed:
        return GateEvaluation(False, gates, g2, 0.0, 0.0)

    # Gate 3: Anchors
    active = [a for a in anchors if a.anchor_status == "Linked"]
    g3 = GateResult("Anchors", 3, len(active) >= 1,
                     None if len(active) >= 1 else "No active CausalAnchor linked")
    gates.append(g3)
    if not g3.passed:
        return GateEvaluation(False, gates, g3, 0.0, 0.0)

    # Compute Gamma
    raw_gamma = compute_gamma(eva_input)

    # Anchor Coherence Clamp
    anchor_gammas = [a.anchor_gamma for a in active if a.anchor_gamma is not None]
    clamped = min(raw_gamma, min(anchor_gammas)) if anchor_gammas else raw_gamma

    # Gate 4: Coherence
    g4 = GateResult("Coherence", 4, clamped >= GAMMA_MIN,
                     None if clamped >= GAMMA_MIN else f"Gamma {clamped:.4f} below SEED {GAMMA_MIN}")
    gates.append(g4)
    if not g4.passed:
        return GateEvaluation(False, gates, g4, raw_gamma, clamped)

    # Gate 5: Entropy
    delta_s = 1.0 - clamped
    g5 = GateResult("Entropy", 5, delta_s > 0,
                     None if delta_s > 0 else "Gamma = 1.0 is thermodynamically impossible")
    gates.append(g5)
    if not g5.passed:
        return GateEvaluation(False, gates, g5, raw_gamma, clamped)

    return GateEvaluation(True, gates, None, raw_gamma, clamped)


# ===========================================================================
# LEGACY TKDF (DEPRECATED - use canonical tkdf256 instead)
# ===========================================================================

TKDF_SALTS = {d: f"CTPIP:TKDF256:{d.upper()}:V1" for d in TRANSFORMATION_DOMAINS}


def sha256_hex(message: str) -> str:
    """SHA-256 hash returning lowercase hex."""
    return hashlib.sha256(message.encode("utf-8")).hexdigest()


def derive_tkdf256(
    operator_hash: str,
    intent_hash: str,
    evidence_hash: str,
    gamma: float,
    tpnc: int,
    domain: str,
) -> str:
    """Derive a TKDF-256 causal key."""
    salt = TKDF_SALTS.get(domain)
    if not salt:
        raise ValueError(f"Unknown transformation domain: {domain}")
    preimage = "|".join([salt, operator_hash, intent_hash, evidence_hash, f"{gamma:.6f}", str(tpnc)])
    return sha256_hex(preimage)


def derive_seal_hash(evidence_hash: str, intent_hash: str, gamma: float, timestamp: str, operator_id: str) -> str:
    """Derive seal hash. Book III S.III.A.4.1."""
    preimage = evidence_hash + intent_hash + f"{gamma:.6f}" + timestamp + operator_id
    return sha256_hex(preimage)


def derive_intent_sig(fingerprint: str, user_id: str, tpnc: int) -> str:
    """Derive IntentSig hash for Phase 0."""
    return sha256_hex(fingerprint + user_id + str(tpnc))


# ===========================================================================
# WELFORD VARIANCE / CALIBRATION
# Source: Book IV S.IV.A.3.00
# ===========================================================================

@dataclass
class WelfordState:
    count: int = 0
    mean: float = 0.0
    m2: float = 0.0

    def update(self, value: float) -> "WelfordState":
        count = self.count + 1
        delta = value - self.mean
        mean = self.mean + delta / count
        delta2 = value - mean
        m2 = self.m2 + delta * delta2
        return WelfordState(count, mean, m2)

    @property
    def variance(self) -> float:
        return self.m2 / self.count if self.count >= 2 else 0.0

    @property
    def stddev(self) -> float:
        return math.sqrt(self.variance)


@dataclass
class EVACalibration:
    E: WelfordState = field(default_factory=WelfordState)
    V: WelfordState = field(default_factory=WelfordState)
    A: WelfordState = field(default_factory=WelfordState)
    gamma: WelfordState = field(default_factory=WelfordState)
    cycle_count: int = 0

    def record(self, E: float, V: float, A: float, gamma: float) -> "EVACalibration":
        return EVACalibration(
            E=self.E.update(E), V=self.V.update(V),
            A=self.A.update(A), gamma=self.gamma.update(gamma),
            cycle_count=self.cycle_count + 1,
        )

    @property
    def ready(self) -> bool:
        """Minimum 10 cycles per Book IV S.IV.A.3.00."""
        return self.cycle_count >= 10

    def fingerprint(self) -> dict:
        return {
            "cycles": self.cycle_count,
            "ready": self.ready,
            "E": {"mean": self.E.mean, "variance": self.E.variance, "stddev": self.E.stddev},
            "V": {"mean": self.V.mean, "variance": self.V.variance, "stddev": self.V.stddev},
            "A": {"mean": self.A.mean, "variance": self.A.variance, "stddev": self.A.stddev},
            "gamma": {"mean": self.gamma.mean, "variance": self.gamma.variance, "stddev": self.gamma.stddev},
        }


# ===========================================================================
# MODULE API
# ===========================================================================

__all__ = [
    # Constants
    "PHI", "LAMBDA_LUX", "EPSILON_0", "GAMMA_MIN", "GAMMA_BLOOM", "GAMMA_ROOT",
    "ALPHA_DEFAULT", "PARITY_BTC", "PARITY_SATS", "CVF_RATE", "ROYALTY_RATE",
    "GENESIS_FEE_USD", "TRANSFORMATION_DOMAINS", "Classification", "Verdict",
    # Canonical TKDF-256
    "SALTS", "float64_be", "uint32_be", "uint64_be", "tkdf256", "derive_heritage", "derive_seal",
    # EVA
    "EVAInput", "EVAResult", "compute_gamma", "compute_ctu", "classify",
    "compute_temporal_debt", "compute_attention", "evaluate_eva",
    # Gates
    "CausalAnchor", "GateResult", "GateEvaluation", "evaluate_gates",
    # Legacy TKDF (deprecated)
    "TKDF_SALTS", "sha256_hex", "derive_tkdf256", "derive_seal_hash", "derive_intent_sig",
    # Welford
    "WelfordState", "EVACalibration",
]