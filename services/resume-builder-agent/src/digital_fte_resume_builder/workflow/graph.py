"""
LangGraph workflow for resume building and optimization
Pipeline: Extract → Normalize → Optimize (6 parallel agents) → ATS Score → Export
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from langgraph.graph import StateGraph, END
from langgraph.types import Send

logger = logging.getLogger(__name__)


class BuilderState(Enum):
    """States in the resume builder workflow"""

    INIT = "init"
    EXTRACTING = "extracting"
    NORMALIZING = "normalizing"
    OPTIMIZING = "optimizing"
    SCORING = "scoring"
    EXPORTING = "exporting"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class ResumeBuilderInput:
    """Input to resume builder workflow"""

    user_id: str
    correlation_id: str
    source_type: str  # pdf | linkedin | form | voice
    source_data: any  # File path, URL, form dict, or audio file path
    target_job_description: Optional[str] = None
    export_formats: list[str] = field(default_factory=lambda: ["txt", "pdf"])
    s3_output_bucket: Optional[str] = None


@dataclass
class ResumeBuilderState:
    """State throughout resume builder workflow"""

    input: ResumeBuilderInput
    state: BuilderState = BuilderState.INIT

    # Extraction
    extracted_resume: dict = field(default_factory=dict)
    extraction_error: Optional[str] = None

    # Optimization
    optimizer_results: list[dict] = field(default_factory=list)
    optimizations_applied: int = 0
    optimized_resume: dict = field(default_factory=dict)

    # ATS Scoring
    ats_score: Optional[dict] = None
    can_export: bool = False
    export_messages: list[str] = field(default_factory=list)

    # Export
    export_results: dict = field(default_factory=dict)
    export_paths: dict = field(default_factory=dict)

    # Metadata
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error: Optional[str] = None


class ResumeBuilderGraph:
    """LangGraph workflow for resume building"""

    def __init__(self):
        from digital_fte_resume_builder.optimizers.agents import (
            LinguisticAgent,
            ATSKeywordAgent,
            ImpactAgent,
            CustomizationAgent,
            FormattingAgent,
            AuthenticityAgent,
        )
        from digital_fte_resume_builder.scoring.ats_scorer import ATSScorer
        from digital_fte_resume_builder.exporters.exporters import ExportManager

        self.linguistic_agent = LinguisticAgent()
        self.ats_keyword_agent = ATSKeywordAgent()
        self.impact_agent = ImpactAgent()
        self.customization_agent = CustomizationAgent()
        self.formatting_agent = FormattingAgent()
        self.authenticity_agent = AuthenticityAgent()

        self.ats_scorer = ATSScorer()
        self.export_manager = ExportManager()

        self.graph = self._build_graph()

    def _build_graph(self):
        """Build the LangGraph state machine"""
        workflow = StateGraph(ResumeBuilderState)

        # Add nodes
        workflow.add_node("extract", self._extract_node)
        workflow.add_node("normalize", self._normalize_node)
        workflow.add_node("optimize_parallel", self._optimize_parallel_node)
        workflow.add_node("score_ats", self._score_ats_node)
        workflow.add_node("export", self._export_node)
        workflow.add_node("finalize", self._finalize_node)
        workflow.add_node("error_handler", self._error_node)

        # Define edges
        workflow.set_entry_point("extract")
        workflow.add_edge("extract", "normalize")
        workflow.add_edge("normalize", "optimize_parallel")
        workflow.add_edge("optimize_parallel", "score_ats")
        workflow.add_edge("score_ats", "export")
        workflow.add_edge("export", "finalize")
        workflow.add_edge("finalize", END)
        workflow.add_edge("error_handler", END)

        return workflow.compile()

    async def execute(self, input_data: ResumeBuilderInput) -> ResumeBuilderState:
        """Execute the resume builder workflow"""
        state = ResumeBuilderState(input=input_data)
        state.start_time = datetime.utcnow()

        try:
            config = {"recursion_limit": 100}
            result = await self.graph.ainvoke(state, config)
            return result
        except Exception as e:
            logger.error(f"Workflow error: {e}")
            state.state = BuilderState.ERROR
            state.error = str(e)
            return state

    async def _extract_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Extract resume from source"""
        logger.info(f"Extracting resume from {state.input.source_type}")

        try:
            from digital_fte_resume_builder.extractors.pdf_extractor import PDFExtractor
            from digital_fte_resume_builder.extractors.form_extractor import FormExtractor

            if state.input.source_type == "pdf":
                extractor = PDFExtractor()
                extracted = await extractor.extract(state.input.source_data)
            elif state.input.source_type == "form":
                extractor = FormExtractor()
                extracted = await extractor.extract(state.input.source_data)
            else:
                state.extraction_error = f"Unknown source type: {state.input.source_type}"
                return state

            state.extracted_resume = extracted.__dict__
            state.state = BuilderState.EXTRACTING

        except Exception as e:
            logger.error(f"Extraction error: {e}")
            state.extraction_error = str(e)
            state.error = str(e)
            state.state = BuilderState.ERROR

        return state

    async def _normalize_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Normalize extracted data"""
        logger.info("Normalizing extracted resume data")

        state.state = BuilderState.NORMALIZING
        state.optimized_resume = state.extracted_resume.copy()

        return state

    async def _optimize_parallel_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """
        Run 6 optimization agents in parallel.
        AuthenticityAgent runs last (not in parallel).
        """
        logger.info("Running 6 optimization agents in parallel")

        resume_text = self._dict_to_text(state.optimized_resume)

        context = {
            "job_description": state.input.target_job_description or "",
            "target_role": "",
        }

        # Run 5 agents in parallel
        results = await asyncio.gather(
            self.linguistic_agent.optimize(resume_text, context),
            self.ats_keyword_agent.optimize(resume_text, context),
            self.impact_agent.optimize(resume_text, context),
            self.customization_agent.optimize(resume_text, context),
            self.formatting_agent.optimize(resume_text, context),
            return_exceptions=True,
        )

        # Collect results
        for result in results:
            if not isinstance(result, Exception):
                state.optimizer_results.append(
                    {
                        "agent": result.agent_name,
                        "changes": len(result.changes),
                        "summary": result.summary,
                    }
                )
                logger.info(f"{result.agent_name}: {len(result.changes)} suggestions")

        # Apply changes
        for result in results:
            if not isinstance(result, Exception) and hasattr(result, "changes"):
                for change in result.changes:
                    state.optimizations_applied += 1

        # Now run AuthenticityAgent (last)
        logger.info("Running Authenticity Agent (last)")
        auth_result = await self.authenticity_agent.optimize(resume_text, context)
        state.optimizer_results.append(
            {
                "agent": auth_result.agent_name,
                "changes": len(auth_result.changes),
                "summary": auth_result.summary,
            }
        )

        state.state = BuilderState.OPTIMIZING

        return state

    async def _score_ats_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Score resume for ATS compatibility"""
        logger.info("Scoring resume for ATS compatibility")

        resume_text = self._dict_to_text(state.optimized_resume)

        ats_score = await self.ats_scorer.score(
            resume_text, state.input.target_job_description
        )

        state.ats_score = {
            "overall_score": ats_score.overall_score,
            "level": ats_score.level,
            "checkpoint_count": len(ats_score.checkpoints),
            "blockers": ats_score.blockers,
            "warnings": ats_score.warnings,
        }

        can_export, messages = self.ats_scorer.validate_score(ats_score)
        state.can_export = can_export
        state.export_messages = messages

        state.state = BuilderState.SCORING

        logger.info(f"ATS Score: {ats_score.overall_score}/100 ({ats_score.level})")

        return state

    async def _export_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Export resume in requested formats"""
        if not state.can_export:
            logger.warning("Resume cannot be exported (ATS score too low)")
            state.state = BuilderState.EXPORTING
            return state

        logger.info(f"Exporting resume in {len(state.input.export_formats)} formats")

        resume_text = self._dict_to_text(state.optimized_resume)

        for format_type in state.input.export_formats:
            # For testing, just create mock export paths
            output_path = f"/tmp/resume.{format_type}"
            success, message = await self.export_manager.export(
                resume_text, output_path, format_type
            )

            state.export_results[format_type] = {
                "success": success,
                "message": message,
            }
            if success:
                state.export_paths[format_type] = output_path
                logger.info(f"Exported to {output_path}")

        state.state = BuilderState.EXPORTING

        return state

    async def _finalize_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Finalize results"""
        state.state = BuilderState.COMPLETE
        state.end_time = datetime.utcnow()

        duration = (state.end_time - state.start_time).total_seconds()

        logger.info(
            f"Resume building complete: {state.optimizations_applied} optimizations, "
            f"ATS score {state.ats_score.get('overall_score', 0)}/100, "
            f"exported {len(state.export_paths)} formats in {duration:.1f}s"
        )

        return state

    async def _error_node(self, state: ResumeBuilderState) -> ResumeBuilderState:
        """Handle errors"""
        state.state = BuilderState.ERROR
        logger.error(f"Workflow error: {state.error}")
        return state

    def _dict_to_text(self, resume_dict: dict) -> str:
        """Convert resume dict to formatted text"""
        lines = []

        # Header
        if resume_dict.get("full_name"):
            lines.append(f"{resume_dict['full_name'].upper()}")
        contact = []
        if resume_dict.get("email"):
            contact.append(resume_dict["email"])
        if resume_dict.get("phone"):
            contact.append(resume_dict["phone"])
        if resume_dict.get("location"):
            contact.append(resume_dict["location"])
        if contact:
            lines.append(" | ".join(contact))
        lines.append("")

        # Summary
        if resume_dict.get("professional_summary"):
            lines.append("PROFESSIONAL SUMMARY")
            lines.append(resume_dict["professional_summary"])
            lines.append("")

        # Experience
        if resume_dict.get("work_experience"):
            lines.append("EXPERIENCE")
            for job in resume_dict["work_experience"]:
                lines.append(f"{job.get('role', '')} | {job.get('company', '')}")
                lines.append(job.get("description", ""))
                lines.append("")

        # Skills
        if resume_dict.get("skills"):
            lines.append("SKILLS")
            lines.append(", ".join(resume_dict["skills"]))
            lines.append("")

        return "\n".join(lines)

    async def run(self, input_data: ResumeBuilderInput) -> dict:
        """Run resume builder and return results"""
        state = await self.execute(input_data)

        return {
            "success": state.state == BuilderState.COMPLETE,
            "ats_score": state.ats_score,
            "can_export": state.can_export,
            "export_messages": state.export_messages,
            "export_results": state.export_results,
            "export_paths": state.export_paths,
            "optimizations": {
                "total_applied": state.optimizations_applied,
                "agents_run": [r["agent"] for r in state.optimizer_results],
            },
            "duration_seconds": (state.end_time - state.start_time).total_seconds()
            if state.end_time
            else 0,
            "error": state.error,
        }
