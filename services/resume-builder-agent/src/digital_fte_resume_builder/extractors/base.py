"""
Base resume extractor class
All extractors extend this and implement extraction logic
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExtractedResume:
    """Standardized resume data after extraction"""

    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    headline: Optional[str] = None

    # Experience
    work_experience: list[dict] = None
    # [{ company, role, duration, location, description, skills }]

    # Education
    education: list[dict] = None
    # [{ school, degree, field, graduation_date, details }]

    # Skills
    skills: list[str] = None
    # ["Python", "AWS", ...]

    # Certifications
    certifications: list[dict] = None
    # [{ name, issuer, date, credential_url }]

    # Projects
    projects: list[dict] = None
    # [{ title, description, link }]

    # Volunteering
    volunteer_work: list[dict] = None
    # [{ organization, role, duration, description }]

    # Languages
    languages: list[dict] = None

    def __post_init__(self):
        """Initialize list fields to empty lists if None"""
        if self.work_experience is None:
            self.work_experience = []
        if self.education is None:
            self.education = []
        if self.skills is None:
            self.skills = []
        if self.certifications is None:
            self.certifications = []
        if self.projects is None:
            self.projects = []
        if self.volunteer_work is None:
            self.volunteer_work = []
        if self.languages is None:
            self.languages = []
    # [{ language, proficiency }]

    # Raw content
    raw_text: str = None

    def __post_init__(self) -> None:
        if self.work_experience is None:
            self.work_experience = []
        if self.education is None:
            self.education = []
        if self.skills is None:
            self.skills = []
        if self.certifications is None:
            self.certifications = []
        if self.projects is None:
            self.projects = []
        if self.volunteer_work is None:
            self.volunteer_work = []
        if self.languages is None:
            self.languages = []


class BaseExtractor(ABC):
    """Base class for resume extractors"""

    def __init__(self, source_type: str):
        self.source_type = source_type
        self.logger = logging.getLogger(f"extractor.{source_type}")

    @abstractmethod
    async def extract(self, source: any) -> ExtractedResume:
        """
        Extract resume data from source.

        Args:
            source: Source data (file path, URL, raw text, audio file, etc.)

        Returns:
            ExtractedResume with standardized structure
        """
        pass

    def normalize_text(self, text: str) -> str:
        """Normalize extracted text"""
        return text.strip()

    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text"""
        import re

        pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        import re

        # US format: (555) 123-4567 or 555-123-4567 or 5551234567
        pattern = r"(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})"
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def extract_linkedin_url(self, text: str) -> Optional[str]:
        """Extract LinkedIn URL from text"""
        import re

        pattern = r"https?://(?:www\.)?linkedin\.com/in/[\w\-]+"
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def parse_date(self, date_str: str) -> Optional[str]:
        """
        Parse various date formats.

        Returns: ISO format (YYYY-MM) or None
        """
        from datetime import datetime

        # Try common formats
        formats = [
            "%B %Y",  # January 2023
            "%b %Y",  # Jan 2023
            "%m/%Y",  # 01/2023
            "%Y-%m",  # 2023-01
            "%Y",  # 2023
        ]

        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime("%Y-%m")
            except ValueError:
                continue

        return None
