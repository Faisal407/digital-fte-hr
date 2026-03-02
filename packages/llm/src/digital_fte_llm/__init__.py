"""Digital FTE LLM Package

Claude API wrapper, prompt templates, and LangGraph setup
"""

from .claude import (
    claude_call,
    claude_call_with_validation,
    get_cost_summary,
    reset_cost_tracker,
    set_config,
    ClaudeCallResult,
    ClaudeCallConfig,
    SONNET,
    HAIKU,
    OPUS,
)

__all__ = [
    "claude_call",
    "claude_call_with_validation",
    "get_cost_summary",
    "reset_cost_tracker",
    "set_config",
    "ClaudeCallResult",
    "ClaudeCallConfig",
    "SONNET",
    "HAIKU",
    "OPUS",
]

__version__ = "1.0.0"
