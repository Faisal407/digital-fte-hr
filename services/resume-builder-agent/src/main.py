"""Resume Builder Agent entry point - Build and optimize resumes with AI"""

import asyncio
import logging
from pathlib import Path

from digital_fte_resume_builder import ResumeBuilderGraph, ResumeBuilderInput

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def build_and_optimize_resume(
    user_id: str,
    correlation_id: str,
    source_type: str,
    source_data: str,
    target_job_description: str = None,
    export_formats: list[str] = None,
    s3_output_bucket: str = None,
) -> dict:
    """
    Build and optimize a resume with AI.

    Args:
        user_id: User identifier
        correlation_id: Correlation ID for tracking
        source_type: Source type ('pdf', 'form', 'linkedin', 'voice')
        source_data: Source data (file path, URL, form dict, or audio file path)
        target_job_description: Optional target job description for optimization
        export_formats: Desired export formats ['txt', 'pdf', 'docx']
        s3_output_bucket: Optional S3 bucket for output storage

    Returns:
        Dict with results:
        {
            'success': bool,
            'ats_score': {...},
            'can_export': bool,
            'export_messages': [...],
            'export_results': {...},
            'export_paths': {...},
            'optimizations': {...},
            'duration_seconds': float,
            'error': Optional[str]
        }
    """
    logger.info(
        f"Starting resume build and optimization",
        extra={
            "user_id": user_id,
            "correlation_id": correlation_id,
            "source_type": source_type,
        },
    )

    # Initialize builder
    builder = ResumeBuilderGraph()

    # Prepare input
    input_data = ResumeBuilderInput(
        user_id=user_id,
        correlation_id=correlation_id,
        source_type=source_type,
        source_data=source_data,
        target_job_description=target_job_description,
        export_formats=export_formats or ["txt", "pdf"],
        s3_output_bucket=s3_output_bucket,
    )

    # Run workflow
    results = await builder.run(input_data)

    logger.info(
        f"Resume optimization complete",
        extra={
            "user_id": user_id,
            "success": results["success"],
            "ats_score": results.get("ats_score", {}).get("overall_score"),
            "duration_seconds": results["duration_seconds"],
        },
    )

    return results


async def main():
    """Test the Resume Builder Agent with example usage"""
    # Example: Process a PDF resume
    pdf_path = "example_resume.pdf"

    # For testing, create a sample resume if it doesn't exist
    if not Path(pdf_path).exists():
        logger.info(f"Note: {pdf_path} not found. Using form-based input instead.")

        # Use form-based input for testing
        sample_resume_data = {
            "full_name": "Jane Smith",
            "email": "jane.smith@email.com",
            "phone": "+1-555-123-4567",
            "location": "San Francisco, CA",
            "professional_summary": "Senior Software Engineer with 8+ years of experience in full-stack development and cloud infrastructure. Specialized in Python, JavaScript, and AWS.",
            "work_experience": [
                {
                    "company": "TechCorp Inc.",
                    "role": "Senior Software Engineer",
                    "start_date": "2020-01-01",
                    "end_date": None,
                    "description": "Led development of microservices architecture using Python and AWS. Managed team of 5 engineers. Increased system performance by 40%.",
                }
            ],
            "education": [
                {
                    "school": "Stanford University",
                    "degree": "BS",
                    "field": "Computer Science",
                    "graduation_date": "2015",
                }
            ],
            "skills": [
                "Python",
                "JavaScript",
                "AWS",
                "Docker",
                "Kubernetes",
                "PostgreSQL",
                "React",
                "System Design",
            ],
        }

        # Example job description for optimization
        job_description = """
        Senior Software Engineer - Cloud Infrastructure

        We're looking for an experienced Senior Software Engineer to lead our cloud infrastructure team.

        Requirements:
        - 7+ years of software engineering experience
        - Strong expertise in Python and AWS
        - Experience with containerization (Docker, Kubernetes)
        - Database design and optimization
        - System architecture and design patterns
        - Team leadership experience

        Nice to have:
        - Machine learning experience
        - DevOps background
        - Open source contributions
        """

        results = await build_and_optimize_resume(
            user_id="test_user_001",
            correlation_id="corr_001_resume_build",
            source_type="form",
            source_data=sample_resume_data,
            target_job_description=job_description,
            export_formats=["txt", "pdf"],
        )
    else:
        # Use PDF file
        results = await build_and_optimize_resume(
            user_id="test_user_001",
            correlation_id="corr_001_resume_build",
            source_type="pdf",
            source_data=pdf_path,
            target_job_description="Senior Software Engineer role at a leading tech company",
            export_formats=["txt", "pdf"],
        )

    # Display results
    print("\n" + "=" * 80)
    print("RESUME BUILDER RESULTS")
    print("=" * 80)

    print(f"\nSuccess: {results['success']}")
    print(f"Duration: {results['duration_seconds']:.2f} seconds")

    if results.get("ats_score"):
        ats = results["ats_score"]
        print(f"\nATS Score: {ats['overall_score']}/100 ({ats['level']})")
        print(f"Blockers: {len(ats.get('blockers', []))}")
        print(f"Warnings: {len(ats.get('warnings', []))}")

    print(f"\nCan Export: {results['can_export']}")
    if results.get("export_messages"):
        print("Export Messages:")
        for msg in results["export_messages"]:
            print(f"  {msg}")

    if results.get("export_results"):
        print("\nExport Results:")
        for fmt, res in results["export_results"].items():
            status = "✅" if res["success"] else "❌"
            print(f"  {status} {fmt.upper()}: {res['message']}")
            if res["success"] and fmt in results.get("export_paths", {}):
                print(f"     Path: {results['export_paths'][fmt]}")

    if results.get("optimizations"):
        opt = results["optimizations"]
        print(f"\nOptimizations Applied: {opt['total_applied']}")
        print(f"Agents Run: {', '.join(opt['agents_run'])}")

    if results.get("error"):
        print(f"\nError: {results['error']}")

    print("\n" + "=" * 80)

    return results


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result.get("success") else 1)
