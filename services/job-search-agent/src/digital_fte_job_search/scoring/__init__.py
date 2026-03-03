"""Job scoring and filtering"""

from .matcher import JobMatcher, UserProfile, MatchScore
from .deduplicator import JobDeduplicator, DedupeGroup
from .ghost_detector import GhostJobDetector

__all__ = [
    "JobMatcher",
    "UserProfile",
    "MatchScore",
    "JobDeduplicator",
    "DedupeGroup",
    "GhostJobDetector",
]
