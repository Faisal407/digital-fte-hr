---
name: playwright-applier
description: Builds and maintains Playwright browser automation scripts for Digital FTE's Auto-Apply Agent. Use when implementing ATS form handlers (Workday, Greenhouse, Lever, Taleo, iCIMS, LinkedIn Easy Apply, Indeed Apply), adding new job board scrapers, writing screenshot capture logic, or handling CAPTCHA detection. This is the MOST safety-critical skill — enforces human-in-loop approval on every action.
---

# Playwright Auto-Apply Skill — Digital FTE (⚠️ SAFETY CRITICAL)

## ⚠️ ABSOLUTE SAFETY RULES — NEVER VIOLATE

```
1. NO approval token = NO form submission. Full stop. No exceptions.
2. Screenshot BEFORE and AFTER every submission — proof of what was submitted
3. NEVER fill: SSN, passport, bank account, salary history (flag to user)
4. NEVER fill: legal agreement fields without explicit per-field approval
5. Hard daily cap: 150 applications across all ATS platforms
6. CAPTCHA detected = PAUSE workflow, notify user, wait for manual resolve
7. Failed submission = LOG the failure, do NOT silently retry or move on
```

## Base ATS Handler (All Handlers Extend This)

```python
# services/auto-apply-agent/ats/base.py
from abc import ABC, abstractmethod
from playwright.async_api import Page, BrowserContext
from pathlib import Path
import asyncio
from datetime import datetime
from ..lib.screenshot import capture_screenshot
from ..lib.audit import audit_log
from ..models import ApplicationReview, SubmissionResult, SubmissionStatus

class BaseATSHandler(ABC):
    """
    SAFETY-CRITICAL: All ATS handlers must extend this class.
    Never submit a form without calling verify_approval() first.
    """
    platform_name: str   # Subclass must set this

    def __init__(self, page: Page, context: BrowserContext):
        self.page    = page
        self.context = context

    @abstractmethod
    async def detect(self, url: str) -> bool:
        """Returns True if this handler can handle the given ATS URL"""
        pass

    @abstractmethod
    async def fill_form(self, profile: dict, answers: dict) -> dict:
        """Fill all form fields. Return dict of {field: value_filled}"""
        pass

    @abstractmethod
    async def submit(self) -> bool:
        """Click final submit button. Returns True if submission page detected."""
        pass

    # ── MANDATORY SAFETY CHECKS — never override ──────────────────────────────

    async def verify_approval(self, application_id: str, user_id: str) -> None:
        """Raises ApprovalRequired if human has not approved this application."""
        from ..lib.approval_store import ApprovalStore
        approved = await ApprovalStore.is_approved(application_id, user_id)
        if not approved:
            raise ApprovalRequired(
                f"Application {application_id} has not been approved by user {user_id}. "
                "NEVER submit without explicit approval."
            )

    async def capture_pre_submit_screenshot(self, application_id: str) -> Path:
        """Capture screenshot of filled form before submission."""
        path = capture_screenshot(self.page, f"pre-submit-{application_id}-{datetime.utcnow().isoformat()}")
        await audit_log(application_id, 'PRE_SUBMIT_SCREENSHOT', {'path': str(path)})
        return path

    async def capture_confirmation_screenshot(self, application_id: str) -> Path:
        """Capture screenshot of confirmation page after submission."""
        path = capture_screenshot(self.page, f"confirmation-{application_id}-{datetime.utcnow().isoformat()}")
        await audit_log(application_id, 'CONFIRMATION_SCREENSHOT', {'path': str(path)})
        return path

    async def check_captcha(self) -> bool:
        """Returns True if CAPTCHA is detected on current page."""
        captcha_selectors = [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]',
            '[data-sitekey]',
            '.g-recaptcha',
            '#captcha',
            'cf-turnstile',
        ]
        for selector in captcha_selectors:
            if await self.page.locator(selector).count() > 0:
                return True
        return False

    async def safe_fill(self, selector: str, value: str, field_name: str) -> bool:
        """
        Fill a field only if it's safe (not SSN, passport, bank, salary history).
        Returns False if field was flagged as sensitive and skipped.
        """
        BLOCKED_FIELD_PATTERNS = [
            'ssn', 'social_security', 'passport', 'national_id',
            'bank_account', 'routing_number', 'salary_history',
            'previous_salary', 'current_compensation',
        ]
        field_lower = field_name.lower().replace(' ', '_')
        if any(p in field_lower for p in BLOCKED_FIELD_PATTERNS):
            await audit_log('SYSTEM', 'SENSITIVE_FIELD_SKIPPED', {'field': field_name, 'selector': selector})
            return False

        element = self.page.locator(selector)
        await element.fill(value)
        return True
```

## Workday Handler

```python
# services/auto-apply-agent/ats/workday.py
from .base import BaseATSHandler, ApprovalRequired

class WorkdayHandler(BaseATSHandler):
    platform_name = 'workday'

    # Workday uses consistent field IDs across all companies
    FIELD_MAP = {
        'first_name':   '[data-automation-id="legalNameSection_firstName"]',
        'last_name':    '[data-automation-id="legalNameSection_lastName"]',
        'email':        '[data-automation-id="email"]',
        'phone':        '[data-automation-id="phone-number"]',
        'linkedin_url': '[data-automation-id="linkedInUrl"]',
        'resume_upload':'[data-automation-id="file-upload-input-ref"]',
        'cover_letter': '[data-automation-id="coverLetterSection"] textarea',
    }

    async def detect(self, url: str) -> bool:
        return 'myworkdayjobs.com' in url or 'workday.com' in url

    async def fill_form(self, profile: dict, answers: dict) -> dict:
        filled = {}
        page   = self.page

        # Navigate through Workday's multi-step form
        steps = await page.locator('[data-automation-id="progressBar"] button').all()

        for step_idx, step in enumerate(steps):
            await step.click()
            await page.wait_for_load_state('networkidle')

            # Check for CAPTCHA at each step
            if await self.check_captcha():
                raise CAPTCHADetected(f"CAPTCHA at Workday step {step_idx}")

            # Fill fields present on this step
            for field, selector in self.FIELD_MAP.items():
                if profile.get(field) and await page.locator(selector).count() > 0:
                    success = await self.safe_fill(selector, profile[field], field)
                    if success:
                        filled[field] = profile[field]

            # Handle screening questions
            questions = await page.locator('[data-automation-id="questionSection"]').all()
            for q in questions:
                q_text   = await q.locator('.gwt-Label').inner_text()
                answer   = await self._resolve_answer(q_text, answers)
                if answer:
                    await self._fill_question(q, answer)

        return filled

    async def submit(self) -> bool:
        submit_btn = self.page.locator('[data-automation-id="bottom-navigation-next-button"]:has-text("Submit")')
        if await submit_btn.count() == 0:
            return False
        await submit_btn.click()
        await self.page.wait_for_load_state('networkidle')
        # Check for confirmation
        return await self.page.locator('[data-automation-id="thankYouPage"]').count() > 0
```

## Answer Memory Bank (Cosine Similarity Matching)

```python
# services/auto-apply-agent/lib/answer_memory.py
import hashlib
import json
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class AnswerMemoryBank:
    """
    Stores user's answers to screening questions.
    When a similar question is seen again, reuses the answer automatically.
    NEW questions or sensitive topics always go to user for approval.
    """
    SIMILARITY_THRESHOLD = 0.85   # Minimum cosine similarity to reuse an answer

    NEVER_AUTO_ANSWER = [
        'legal', 'criminal', 'felony', 'disability', 'veteran',
        'authorize', 'sponsorship', 'citizenship', 'clearance'
    ]

    async def get_answer(self, question: str, user_id: str) -> str | None:
        # Reject sensitive questions immediately
        q_lower = question.lower()
        if any(kw in q_lower for kw in self.NEVER_AUTO_ANSWER):
            return None   # Will be flagged to user

        # Check stored answers by semantic similarity
        stored = await self._load_answers(user_id)
        if not stored:
            return None

        q_embedding  = await self._embed(question)
        similarities = [cosine_similarity([q_embedding], [a['embedding']])[0][0] for a in stored]
        best_idx     = int(np.argmax(similarities))

        if similarities[best_idx] >= self.SIMILARITY_THRESHOLD:
            return stored[best_idx]['answer']

        return None  # New question — needs user input

    async def store_answer(self, question: str, answer: str, user_id: str):
        embedding = await self._embed(question)
        fingerprint = hashlib.sha256(question.encode()).hexdigest()[:16]
        await self._save_answer(user_id, {
            'fingerprint': fingerprint,
            'question':    question,
            'answer':      answer,
            'embedding':   embedding,
        })
```

## Application Orchestrator (Full Flow)

```python
# services/auto-apply-agent/orchestrator.py
async def process_application(app: ApplicationReview, user_id: str) -> SubmissionResult:
    # Step 1: VERIFY APPROVAL — mandatory, no exceptions
    handler = get_handler(app.job_url)
    await handler.verify_approval(app.id, user_id)

    # Step 2: Check daily cap
    today_count = await get_daily_application_count(user_id)
    if today_count >= 150:
        raise DailyCapExceeded(f"Daily cap of 150 reached. Count: {today_count}")

    # Step 3: Navigate to job
    async with get_browser_session(app.platform) as (page, context):
        h = handler(page, context)
        await page.goto(app.job_url)

        # Step 4: CAPTCHA check on landing
        if await h.check_captcha():
            await notify_user(user_id, 'CAPTCHA_DETECTED', {'url': app.job_url})
            return SubmissionResult(status=SubmissionStatus.CAPTCHA_PAUSED)

        # Step 5: Fill form
        profile = await get_user_profile(user_id)
        answers = await AnswerMemoryBank().get_all_answers(user_id)
        filled  = await h.fill_form(profile, answers)

        # Step 6: Screenshot BEFORE submit (audit trail)
        pre_screenshot = await h.capture_pre_submit_screenshot(app.id)

        # Step 7: Submit
        success = await h.submit()

        # Step 8: Screenshot AFTER submit (confirmation)
        post_screenshot = await h.capture_confirmation_screenshot(app.id)

        # Step 9: Increment daily counter
        await increment_daily_count(user_id)

        return SubmissionResult(
            status          = SubmissionStatus.SUCCESS if success else SubmissionStatus.FAILED,
            applicationId   = app.id,
            preScreenshot   = str(pre_screenshot),
            postScreenshot  = str(post_screenshot),
            fieldsFilled    = filled,
        )
```

## Rules

- `verify_approval()` is called in `BaseATSHandler` and cannot be removed or bypassed
- `safe_fill()` must be used for ALL field filling — never `element.fill()` directly
- Screenshots are stored in S3 with 90-day retention — never delete them
- All handlers must be tested with `--dry-run` mode before production
- Add new ATS platforms by extending `BaseATSHandler` only — never standalone scripts
- CAPTCHA: pause, log, notify user, return `SubmissionStatus.CAPTCHA_PAUSED` — never attempt bypass
