"""
Claude API wrapper with retry logic, rate limiting, and cost tracking
Never import anthropic directly - use this wrapper instead
"""

import os
import time
import asyncio
import json
from typing import Optional, Any, TypeVar, Generic
from datetime import datetime
import logging

from anthropic import Anthropic, AsyncAnthropic, APIError, RateLimitError, APIConnectionError
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

# Models
SONNET = "claude-3-5-sonnet-20241022"  # Complex reasoning, generation
HAIKU = "claude-haiku-4-5-20251001"  # Fast, cheap scoring/classification
OPUS = "claude-3-opus-20250805"  # Most capable (fallback)

T = TypeVar('T', bound=BaseModel)


class ClaudeCallConfig:
    """Configuration for Claude API calls"""
    max_retries: int = 3
    base_delay_seconds: float = 1.0
    exponential_backoff: bool = True
    timeout_seconds: int = 30
    max_tokens: int = 4096
    temperature: float = 0.7


class CostTracker:
    """Track API costs for monitoring"""

    # Pricing per million tokens (as of 2024)
    PRICING = {
        SONNET: {"input": 3.0, "output": 15.0},
        HAIKU: {"input": 0.80, "output": 4.0},
        OPUS: {"input": 15.0, "output": 75.0},
    }

    def __init__(self) -> None:
        self.total_cost = 0.0
        self.calls_made = 0
        self.tokens_used = {"input": 0, "output": 0}

    def track(self, model: str, input_tokens: int, output_tokens: int) -> None:
        """Track API usage and cost"""
        pricing = self.PRICING.get(model, self.PRICING[HAIKU])

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        self.total_cost += input_cost + output_cost
        self.tokens_used["input"] += input_tokens
        self.tokens_used["output"] += output_tokens
        self.calls_made += 1

        logger.info(f"API Call: model={model}, input={input_tokens}, output={output_tokens}, "
                   f"cost=${input_cost + output_cost:.6f}, total_cost=${self.total_cost:.2f}")

    def get_summary(self) -> dict[str, Any]:
        """Get cost summary"""
        return {
            "total_cost": self.total_cost,
            "calls_made": self.calls_made,
            "tokens_used": self.tokens_used,
            "avg_cost_per_call": self.total_cost / self.calls_made if self.calls_made > 0 else 0,
        }


# Global instances
_client: Optional[Anthropic] = None
_async_client: Optional[AsyncAnthropic] = None
_cost_tracker = CostTracker()
_config = ClaudeCallConfig()


def get_client() -> Anthropic:
    """Get or create Anthropic client (singleton)"""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _client = Anthropic(api_key=api_key)
    return _client


def get_async_client() -> AsyncAnthropic:
    """Get or create async Anthropic client (singleton)"""
    global _async_client
    if _async_client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _async_client = AsyncAnthropic(api_key=api_key)
    return _async_client


class ClaudeCallResult(BaseModel):
    """Result of a Claude API call"""
    success: bool
    content: str
    tokens_used: dict[str, int]
    model: str
    timestamp: datetime
    retries: int = 0
    error: Optional[str] = None


async def claude_call(
    model: str,
    prompt: str,
    system_prompt: Optional[str] = None,
    max_tokens: Optional[int] = None,
    temperature: Optional[float] = None,
    user_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    **kwargs: Any,
) -> ClaudeCallResult:
    """
    Make a Claude API call with automatic retry logic and cost tracking

    Args:
        model: Model ID (SONNET, HAIKU, OPUS)
        prompt: User message
        system_prompt: System prompt
        max_tokens: Max tokens in response
        temperature: Temperature for generation
        user_id: User ID for rate limiting
        correlation_id: Correlation ID for tracing
        **kwargs: Additional parameters for create()

    Returns:
        ClaudeCallResult with content and metadata
    """
    client = get_async_client()

    if max_tokens is None:
        max_tokens = _config.max_tokens
    if temperature is None:
        temperature = _config.temperature

    messages = [
        {"role": "user", "content": prompt}
    ]

    retries = 0
    last_error = None

    while retries <= _config.max_retries:
        try:
            response = await client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=messages,
                **kwargs,
            )

            # Track cost
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            _cost_tracker.track(model, input_tokens, output_tokens)

            content = response.content[0].text

            logger.info(f"Claude call successful: model={model}, tokens={input_tokens + output_tokens}, "
                       f"correlation_id={correlation_id}")

            return ClaudeCallResult(
                success=True,
                content=content,
                tokens_used={"input": input_tokens, "output": output_tokens},
                model=model,
                timestamp=datetime.utcnow(),
                retries=retries,
            )

        except RateLimitError as e:
            last_error = str(e)
            logger.warning(f"Rate limit hit (attempt {retries + 1}): {e}")

            # Use exponential backoff
            if _config.exponential_backoff:
                delay = _config.base_delay_seconds * (2 ** retries)
            else:
                delay = _config.base_delay_seconds

            await asyncio.sleep(delay)
            retries += 1

        except (APIConnectionError, APIError) as e:
            last_error = str(e)
            logger.error(f"API error (attempt {retries + 1}): {e}")

            if _config.exponential_backoff:
                delay = _config.base_delay_seconds * (2 ** retries)
            else:
                delay = _config.base_delay_seconds

            await asyncio.sleep(delay)
            retries += 1

    # All retries exhausted
    logger.error(f"Claude call failed after {_config.max_retries} retries: {last_error}")

    return ClaudeCallResult(
        success=False,
        content="",
        tokens_used={"input": 0, "output": 0},
        model=model,
        timestamp=datetime.utcnow(),
        retries=retries,
        error=last_error,
    )


async def claude_call_with_validation(
    model: str,
    prompt: str,
    output_model: type[T],
    system_prompt: Optional[str] = None,
    **kwargs: Any,
) -> tuple[bool, T | None, Optional[str]]:
    """
    Claude call that parses and validates output against a Pydantic model

    Args:
        model: Model ID
        prompt: User message
        output_model: Pydantic model to validate against
        system_prompt: System prompt
        **kwargs: Additional parameters

    Returns:
        Tuple of (success, parsed_output, error_message)
    """
    result = await claude_call(model, prompt, system_prompt, **kwargs)

    if not result.success:
        return False, None, result.error

    try:
        # Try to extract JSON from markdown code blocks
        content = result.content
        if "```json" in content:
            import re
            json_match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
        elif "```" in content:
            import re
            json_match = re.search(r"```\s*(.*?)\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)

        # Parse JSON
        data = json.loads(content)

        # Validate against model
        parsed = output_model(**data)
        return True, parsed, None

    except (json.JSONDecodeError, ValidationError) as e:
        error_msg = f"Validation failed: {str(e)}"
        logger.error(f"Output validation error: {error_msg}\nContent: {result.content}")
        return False, None, error_msg


def get_cost_summary() -> dict[str, Any]:
    """Get cost tracking summary"""
    return _cost_tracker.get_summary()


def reset_cost_tracker() -> None:
    """Reset cost tracker (for testing)"""
    global _cost_tracker
    _cost_tracker = CostTracker()


def set_config(config: ClaudeCallConfig) -> None:
    """Update configuration"""
    global _config
    _config = config
