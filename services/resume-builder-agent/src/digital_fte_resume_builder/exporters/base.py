"""
Base resume exporter
All format exporters extend this
"""

from abc import ABC, abstractmethod
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class BaseExporter(ABC):
    """Base class for resume exporters"""

    def __init__(self, format_type: str):
        self.format_type = format_type
        self.logger = logging.getLogger(f"exporter.{format_type}")

    @abstractmethod
    async def export(
        self, resume_text: str, output_path: str, metadata: dict = None
    ) -> bool:
        """
        Export resume to file.

        Args:
            resume_text: Formatted resume text
            output_path: Path to write output file
            metadata: Optional metadata (name, email, etc.)

        Returns:
            True if successful, False otherwise
        """
        pass

    def format_resume_text(
        self,
        full_name: Optional[str],
        email: Optional[str],
        phone: Optional[str],
        location: Optional[str],
        professional_summary: Optional[str],
        work_experience: list,
        education: list,
        skills: list,
        certifications: list = None,
    ) -> str:
        """Format resume data into structured text"""
        lines = []

        # Header with contact info
        if full_name:
            lines.append(f"{full_name.upper()}")
        contact_info = []
        if email:
            contact_info.append(email)
        if phone:
            contact_info.append(phone)
        if location:
            contact_info.append(location)
        if contact_info:
            lines.append(" | ".join(contact_info))
        lines.append("")

        # Professional Summary
        if professional_summary:
            lines.append("PROFESSIONAL SUMMARY")
            lines.append("-" * 40)
            lines.append(professional_summary)
            lines.append("")

        # Work Experience
        if work_experience:
            lines.append("EXPERIENCE")
            lines.append("-" * 40)
            for job in work_experience:
                title = job.get("role", "")
                company = job.get("company", "")
                if title and company:
                    lines.append(f"{title} | {company}")
                duration = job.get("duration", {})
                if isinstance(duration, dict):
                    start = duration.get("start")
                    end = duration.get("end", "Present")
                    if start:
                        lines.append(f"{start} - {end}")
                description = job.get("description", "")
                if description:
                    for bullet in description.split("\n"):
                        if bullet.strip():
                            lines.append(f"  • {bullet.strip()}")
                lines.append("")

        # Education
        if education:
            lines.append("EDUCATION")
            lines.append("-" * 40)
            for edu in education:
                degree = edu.get("degree", "")
                field = edu.get("field", "")
                school = edu.get("school", "")
                if degree or field:
                    lines.append(f"{degree} {'in ' + field if field else ''}".strip())
                if school:
                    lines.append(f"{school}")
                grad_date = edu.get("graduation_date")
                if grad_date:
                    lines.append(f"Graduated: {grad_date}")
                lines.append("")

        # Skills
        if skills:
            lines.append("SKILLS")
            lines.append("-" * 40)
            skills_text = ", ".join(skills)
            lines.append(skills_text)
            lines.append("")

        # Certifications
        if certifications:
            lines.append("CERTIFICATIONS")
            lines.append("-" * 40)
            for cert in certifications:
                name = cert.get("name", "")
                if name:
                    lines.append(f"  • {name}")
                    issuer = cert.get("issuer")
                    if issuer:
                        lines.append(f"    {issuer}")
            lines.append("")

        return "\n".join(lines)
