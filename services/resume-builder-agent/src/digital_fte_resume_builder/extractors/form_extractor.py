"""
Form resume extractor
Extracts resume data from structured form input
"""

import logging
from typing import Optional

from .base import BaseExtractor, ExtractedResume

logger = logging.getLogger(__name__)


class FormExtractor(BaseExtractor):
    """Extract resume data from structured form input"""

    def __init__(self):
        super().__init__("form")

    async def extract(self, form_data: dict) -> ExtractedResume:
        """
        Extract resume from form data.

        Args:
            form_data: Dictionary with form fields

        Returns:
            ExtractedResume with parsed data
        """
        resume = ExtractedResume()

        # Basic info
        resume.full_name = form_data.get("fullName")
        resume.email = form_data.get("email")
        resume.phone = form_data.get("phone")
        resume.location = form_data.get("location")
        resume.professional_summary = form_data.get("summary")
        resume.headline = form_data.get("headline")

        # Skills
        skills = form_data.get("skills", [])
        if isinstance(skills, str):
            resume.skills = [s.strip() for s in skills.split(",")]
        else:
            resume.skills = skills

        # Work experience
        work_items = form_data.get("workExperience", [])
        for item in work_items:
            resume.work_experience.append(
                {
                    "company": item.get("company"),
                    "role": item.get("role"),
                    "duration": {
                        "start": item.get("startDate"),
                        "end": item.get("endDate"),
                    },
                    "location": item.get("location"),
                    "description": item.get("description"),
                    "achievements": item.get("achievements", []),
                }
            )

        # Education
        education_items = form_data.get("education", [])
        for item in education_items:
            resume.education.append(
                {
                    "school": item.get("school"),
                    "degree": item.get("degree"),
                    "field": item.get("field"),
                    "graduation_date": item.get("graduationDate"),
                    "gpa": item.get("gpa"),
                    "details": item.get("details"),
                }
            )

        # Certifications
        cert_items = form_data.get("certifications", [])
        for item in cert_items:
            resume.certifications.append(
                {
                    "name": item.get("name"),
                    "issuer": item.get("issuer"),
                    "date": item.get("date"),
                    "credential_url": item.get("credentialUrl"),
                }
            )

        # Projects
        project_items = form_data.get("projects", [])
        for item in project_items:
            resume.projects.append(
                {
                    "title": item.get("title"),
                    "description": item.get("description"),
                    "link": item.get("link"),
                    "technologies": item.get("technologies", []),
                }
            )

        # Volunteering
        volunteer_items = form_data.get("volunteerWork", [])
        for item in volunteer_items:
            resume.volunteer_work.append(
                {
                    "organization": item.get("organization"),
                    "role": item.get("role"),
                    "duration": {
                        "start": item.get("startDate"),
                        "end": item.get("endDate"),
                    },
                    "description": item.get("description"),
                }
            )

        # Languages
        lang_items = form_data.get("languages", [])
        for item in lang_items:
            resume.languages.append(
                {
                    "language": item.get("language"),
                    "proficiency": item.get("proficiency"),
                }
            )

        self.logger.info("Form data extracted successfully")

        return resume
