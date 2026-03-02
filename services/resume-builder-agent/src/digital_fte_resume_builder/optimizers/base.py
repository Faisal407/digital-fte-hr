"""
Base optimizer agent
All sub-agents extend this and implement optimization logic
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class OptimizationChange:
    """A single optimization change"""

    field: str  # Section of resume (e.g., "work_experience[0]")
    original: str  # Original text
    improved: str  # Improved text
    rationale: str  # Why this change
    impact: str  # "high", "medium", "low"
    agent: str  # Which agent made this change


@dataclass
class OptimizationResult:
    """Result from an optimizer agent"""

    agent_name: str
    changes: list[OptimizationChange]
    summary: str  # Brief summary of optimizations
    warnings: list[str] = None

    def __post_init__(self) -> None:
        if self.warnings is None:
            self.warnings = []


class BaseOptimizer(ABC):
    """Base class for resume optimizer agents"""

    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"optimizer.{agent_name.lower()}")

    @abstractmethod
    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """
        Optimize resume content.

        Args:
            resume_text: Full resume text
            context: Additional context (job description, target role, etc.)

        Returns:
            OptimizationResult with suggested changes
        """
        pass

    async def apply_changes(
        self, resume: dict, changes: list[OptimizationChange]
    ) -> tuple[dict, int]:
        """
        Apply optimization changes to resume.

        Args:
            resume: Resume data structure
            changes: List of changes to apply

        Returns:
            Tuple of (updated_resume, applied_count)
        """
        applied_count = 0

        for change in changes:
            try:
                # Parse field path (e.g., "work_experience[0].description")
                parts = change.field.split(".")
                current = resume

                # Navigate to the field
                for part in parts[:-1]:
                    if "[" in part:
                        key, index = part.split("[")
                        index = int(index.rstrip("]"))
                        current = current[key][index]
                    else:
                        current = current[part]

                # Apply change
                final_key = parts[-1]
                if "[" in final_key:
                    key, index = final_key.split("[")
                    index = int(index.rstrip("]"))
                    current[key][index] = change.improved
                else:
                    current[final_key] = change.improved

                applied_count += 1
                self.logger.info(f"Applied change to {change.field}")

            except Exception as e:
                self.logger.warning(f"Failed to apply change to {change.field}: {e}")

        return resume, applied_count
