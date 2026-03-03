"""Digital FTE Job Search Agent

Multi-platform job scraping with semantic matching, deduplication, and ghost job detection.
"""

from .workflow.graph import JobSearchGraph, JobSearchInput, JobSearchState

__all__ = ["JobSearchGraph", "JobSearchInput", "JobSearchState"]

__version__ = "1.0.0"
