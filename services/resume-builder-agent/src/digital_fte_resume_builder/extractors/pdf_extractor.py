"""
PDF resume extractor
Extracts text and structure from PDF resumes
"""

import logging
from typing import Optional

from .base import BaseExtractor, ExtractedResume

logger = logging.getLogger(__name__)


class PDFExtractor(BaseExtractor):
    """Extract resume data from PDF files"""

    def __init__(self):
        super().__init__("pdf")

    async def extract(self, file_path: str) -> ExtractedResume:
        """
        Extract resume from PDF file.

        Args:
            file_path: Path to PDF file

        Returns:
            ExtractedResume with parsed data
        """
        try:
            import pdfplumber
        except ImportError:
            raise ImportError("pdfplumber required for PDF extraction: pip install pdfplumber")

        resume = ExtractedResume()

        try:
            with pdfplumber.open(file_path) as pdf:
                # Extract all text
                full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                resume.raw_text = full_text

                self.logger.info(f"Extracted {len(full_text)} characters from PDF")

                # Extract basic info
                resume.email = self.extract_email(full_text)
                resume.phone = self.extract_phone(full_text)

                # Parse sections (heuristic-based)
                resume = self._parse_sections(full_text, resume)

        except Exception as e:
            self.logger.error(f"PDF extraction error: {e}")
            raise

        return resume

    def _parse_sections(self, text: str, resume: ExtractedResume) -> ExtractedResume:
        """Parse common resume sections from raw text"""
        lines = text.split("\n")

        # Look for common section headers
        section_keywords = {
            "EXPERIENCE": ["experience", "employment", "work history"],
            "EDUCATION": ["education", "academic", "university", "school"],
            "SKILLS": ["skills", "technical skills", "competencies"],
            "CERTIFICATIONS": ["certifications", "licenses", "certifications & licenses"],
            "PROJECTS": ["projects", "portfolio"],
            "VOLUNTEER": ["volunteer", "volunteering"],
            "LANGUAGES": ["languages", "language skills"],
            "SUMMARY": ["summary", "professional summary", "objective", "profile"],
        }

        current_section = None
        section_content = []

        for line in lines:
            line_upper = line.upper().strip()

            # Check if this is a section header
            found_section = False
            for section, keywords in section_keywords.items():
                if any(kw in line_upper for kw in keywords):
                    # Save previous section
                    if current_section:
                        self._process_section(resume, current_section, section_content)

                    current_section = section
                    section_content = []
                    found_section = True
                    break

            if not found_section and current_section and line.strip():
                section_content.append(line)

        # Process last section
        if current_section:
            self._process_section(resume, current_section, section_content)

        return resume

    def _process_section(
        self, resume: ExtractedResume, section: str, content: list[str]
    ) -> None:
        """Process content from a specific resume section"""
        text = "\n".join(content).strip()

        if section == "SUMMARY":
            resume.professional_summary = text[:500]  # First 500 chars

        elif section == "SKILLS":
            # Split by common delimiters
            skills = text.replace("\n", ", ").split(",")
            resume.skills = [s.strip() for s in skills if s.strip()]

        elif section == "EXPERIENCE":
            # Parse work experience entries
            # This is simplified - real implementation would use Claude
            resume.work_experience = self._parse_experience_entries(text)

        elif section == "EDUCATION":
            # Parse education entries
            resume.education = self._parse_education_entries(text)

        elif section == "CERTIFICATIONS":
            # Parse certifications
            resume.certifications = self._parse_certifications(text)

        elif section == "PROJECTS":
            # Parse projects
            resume.projects = self._parse_projects(text)

        elif section == "VOLUNTEER":
            # Parse volunteer work
            resume.volunteer_work = self._parse_volunteer(text)

        elif section == "LANGUAGES":
            # Parse languages
            resume.languages = self._parse_languages(text)

    def _parse_experience_entries(self, text: str) -> list[dict]:
        """Parse work experience entries (simplified)"""
        entries = []
        # In production, use Claude to parse this properly
        # For now, return basic structure
        return entries

    def _parse_education_entries(self, text: str) -> list[dict]:
        """Parse education entries (simplified)"""
        entries = []
        # In production, use Claude to parse this properly
        return entries

    def _parse_certifications(self, text: str) -> list[dict]:
        """Parse certification entries"""
        entries = []
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            entries.append({"name": line, "issuer": None, "date": None})
        return entries

    def _parse_projects(self, text: str) -> list[dict]:
        """Parse project entries"""
        entries = []
        return entries

    def _parse_volunteer(self, text: str) -> list[dict]:
        """Parse volunteer entries"""
        entries = []
        return entries

    def _parse_languages(self, text: str) -> list[dict]:
        """Parse language entries"""
        entries = []
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            # Format: "Spanish - Fluent" or "Spanish (Fluent)"
            if "-" in line:
                lang, proficiency = line.split("-", 1)
                entries.append(
                    {"language": lang.strip(), "proficiency": proficiency.strip()}
                )
            else:
                entries.append({"language": line, "proficiency": "Unknown"})
        return entries
