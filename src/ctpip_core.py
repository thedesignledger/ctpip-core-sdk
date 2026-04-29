"""
CTP/IP Core SDK - Python Implementation (Non-Authoritative Reference)

This package cannot produce a valid Seal, mint CTU, or sign on-chain
transformations. It exposes the calibration math and TKDF-256 algorithm
of CTP/IP for UI preview, local development, agent verification, and
protocol study only.

Canonical authority lives on Solana mainnet:
  - Program: YvxS7U37b5369xzNXt1EEuXjEkp65Ngcq9NsGUr3bmZ
  - LUX Runtime Oracle PDA: 8QTfNKF66N2uov4MfduioEjfaA6Hi8YBe8Lztoyxnzrk
  - FLUX Mint: Dun6pP3Xsx9CWetKj3zd8iqHz8EYC1amYSeJKG8JzQ9n

Canonical specification: CTP/IP (R2 / operative R22).
Historical R1 record at DOI 10.5281/zenodo.18795109.
R2 publication forthcoming.

Copyright 2025-2026 Ãrico Lisboa / Design Ledger PTY LTD
License: Apache 2.0
"""

import hashlib
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

# ===========================================================================
# PROTOCOL CONSTANTS (REFERENCE ONLY)
#
# These constants are exposed for reference and local calibration.
# Enforcement of protocol invariants -- including the AI Boundary
# (w_AI = 0), EVA Lock, Anti-Circularity, and Binary Validation --
# happens on-chain at the canonical authority. This SDK does not
# and cannot enforce them.
# ===========================================================================

PHI = 1.618033988749895
"""Golden Ratio - temporal scaling constant"""

LAMBDA_LUX = 8.98755178736818e16
"""Lux Limit - upper bound of causal energy density"""

EPSILON_0 = 1.0
"""Stability constant - division-by-zero guard"""

GAMMA_MIN = 0.70
"""SEED threshold - Carnot efficiency limit"""

GAMMA_BLOOM = 0.8187
"""BLOOM threshold - Landauer erasure limit"""

GAMMA_ROOT = 0.95
"""ROOT threshold - relativistic coherence"""

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
    """
    Coherence classification tiers.
    These are band labels for UI preview only.
    Canonical classification happens on-chain at the LUX Runtime Oracle PDA.
    """
    REJECTED = "REJECTED"
    SEED = "SEED"
    BLOOM = "BLOOM"
    ROOT = "ROOT"


class CalibrationCheck(Enum):
    """
    Local calibration check result.
    This is NOT a canonical verdict. Canonical verdicts are issued
    on-chain by the LUX Runtime Oracle PDA only.
    """
    PASSES_LOCAL_CALIBRATION = "PASSES_LOCAL_CALIBRATION"
    FAILS_LOCAL_CALIBRATION = "FAILS_LOCAL_CALIBRATION"


# ===========================================================================
# COHERENCE ESTIMATION (LOCAL, NON-AUTHORITATIVE)
#
# CTU is minted on-chain by LUX Runtime only. This SDK does not
# produce CTU. The gamma estimate is for local UI preview and
# developer calibration only.
# ===========================================================================

@dataclass
class CoherenceInput:
    """Raw coherence inputs."""
    E: float  # Energy commitment [0, 1]
    V: float  # Vector alignment [0, 1]
    A: float  # Attention persistence [0, 1]
    tau: float = 0.0  # Temporal friction [0, inf)


@dataclass
class LocalCoherenceEstimate:
    """
    Local coherence estimate output (non-authoritative).

    CTU is minted on-chain by LUX Runtime only. This SDK does not
    produce CTU. The gamma estimate is for local UI preview and
    developer calibration only.
    """
    gamma_estimate: float
    delta_s: float
    classification_preview: Classification
    calibration_check: CalibrationCheck
    temporal_debt_estimate: float


def compute_gamma(inp: CoherenceInput) -> float:
    """Gamma = (E * V * A) / (tau + epsilon_0)."""
    raw = (inp.E * inp.V * inp.A) / (inp.tau + EPSILON_0)
    return min(1.0, max(0.0, raw))


def classify(gamma: float) -> Classification:
    """Classify gamma into coherence tiers (band labels for UI preview)."""
    if gamma >= GAMMA_ROOT:
        return Classification.ROOT
    if gamma >= GAMMA_BLOOM:
        return Classification.BLOOM
    if gamma >= GAMMA_MIN:
        return Classification.SEED
    return Classification.REJECTED


def compute_temporal_debt(gamma: float, V: float, E: float, A: float) -> float:
    """D = (V * E * A) / (Gamma + epsilon_0)."""
    if gamma >= GAMMA_MIN:
        return 0.0
    return (V * E * A) / (gamma + EPSILON_0)


def compute_attention(gamma_variance: float, alpha: float = ALPHA_DEFAULT) -> float:
    """A = 1 / (1 + alpha * sigma^2)."""
    return 1.0 / (1.0 + alpha * gamma_variance)


def estimate_local_coherence(inp: CoherenceInput) -> LocalCoherenceEstimate:
    """
    Estimate local coherence (non-authoritative).

    This is the local preview equivalent of the on-chain LUX Runtime
    validation. It produces estimates only -- never canonical Seals
    or CTU.
    """
    E = min(1.0, max(0.0, inp.E))
    V = min(1.0, max(0.0, inp.V))
    A = min(1.0, max(0.0, inp.A))
    tau = max(0.0, inp.tau)

    gamma_estimate = compute_gamma(CoherenceInput(E, V, A, tau))
    delta_s = 1.0 - gamma_estimate
    classification_preview = classify(gamma_estimate)

    calibration_check = (
        CalibrationCheck.PASSES_LOCAL_CALIBRATION
        if (gamma_estimate >= GAMMA_MIN and delta_s > 0)
        else CalibrationCheck.FAILS_LOCAL_CALIBRATION
    )

    temporal_debt_estimate = (
        compute_temporal_debt(gamma_estimate, V, E, A)
        if calibration_check == CalibrationCheck.FAILS_LOCAL_CALIBRATION
        else 0.0
    )

    return LocalCoherenceEstimate(
        gamma_estimate=gamma_estimate,
        delta_s=delta_s,
        classification_preview=classification_preview,
        calibration_check=calibration_check,
        temporal_debt_estimate=temporal_debt_estimate,
    )


# ===========================================================================
# TKDF-256 - Transformation Key Derivation Function
#
# Open public-standard cryptographic primitive. Anyone can compute a
# TKDF-256 key from public provenance inputs and verify it independently.
# Only the LUX Runtime Oracle PDA can produce a valid Seal under the
# algorithm.
#
# Algorithm specification: CTP/IP canonical R2 corpus (Book III).
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
    """
    Derive a TKDF-256 causal key.

    Note: this produces verifiable algorithm output only. A valid Seal
    requires signing by the LUX Runtime Oracle PDA on Solana mainnet.
    """
    salt = TKDF_SALTS.get(domain)
    if not salt:
        raise ValueError(f"Unknown transformation domain: {domain}")
    preimage = "|".join([salt, operator_hash, intent_hash, evidence_hash, f"{gamma:.6f}", str(tpnc)])
    return sha256_hex(preimage)


def derive_seal_hash(evidence_hash: str, intent_hash: str, gamma: float, timestamp: str, operator_id: str) -> str:
    """Derive seal hash (verifiable algorithm output only)."""
    preimage = evidence_hash + intent_hash + f"{gamma:.6f}" + timestamp + operator_id
    return sha256_hex(preimage)


def derive_intent_sig(fingerprint: str, user_id: str, tpnc: int) -> str:
    """Derive IntentSig hash for Phase 0."""
    return sha256_hex(fingerprint + user_id + str(tpnc))


# ===========================================================================
# WELFORD VARIANCE / CALIBRATION
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
class CoherenceCalibration:
    """Multi-channel Welford tracker for coherence calibration."""
    E: WelfordState = field(default_factory=WelfordState)
    V: WelfordState = field(default_factory=WelfordState)
    A: WelfordState = field(default_factory=WelfordState)
    gamma: WelfordState = field(default_factory=WelfordState)
    cycle_count: int = 0

    def record(self, E: float, V: float, A: float, gamma: float) -> "CoherenceCalibration":
        return CoherenceCalibration(
            E=self.E.update(E), V=self.V.update(V),
            A=self.A.update(A), gamma=self.gamma.update(gamma),
            cycle_count=self.cycle_count + 1,
        )

    @property
    def ready(self) -> bool:
        """Minimum 10 cycles for calibration enrollment."""
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
    "GENESIS_FEE_USD", "TRANSFORMATION_DOMAINS", "Classification", "CalibrationCheck",
    # Coherence estimation
    "CoherenceInput", "LocalCoherenceEstimate", "compute_gamma", "classify",
    "compute_temporal_debt", "compute_attention", "estimate_local_coherence",
    # TKDF
    "TKDF_SALTS", "sha256_hex", "derive_tkdf256", "derive_seal_hash", "derive_intent_sig",
    # Welford
    "WelfordState", "CoherenceCalibration",
]
