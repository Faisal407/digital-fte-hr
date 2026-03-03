# Auto-Apply Agent — Local Context
# This CLAUDE.md is for: services/auto-apply-agent/
# Inherits root CLAUDE.md + adds auto-apply specific rules

## What This Service Does
Human-in-the-loop application submission pipeline. Receives approved applications from
review queue → opens job application URLs via Playwright → fills forms intelligently →
submits with screenshot proof → tracks status. NEVER submits without explicit user approval.

## ⚠️ THIS IS THE MOST SAFETY-CRITICAL SERVICE ⚠️
Every decision here has real-world consequences for the user's job search.
When in doubt, err on the side of PAUSING and asking the user.

## Critical Safety Rules (Read These First — They Are Absolute)
1. **NO approval = NO submit** — `wait_for_approval()` must return `approved: true` before any form submission. This is not optional.
2. **Screenshot every submission** — capture full-page screenshot on submit button click → S3 → link to application record
3. **Never fill in financial data** — if form asks for bank account, salary slips, tax ID → PAUSE → notify user to complete manually
4. **Never fill in legal documents** — background check authorization, right-to-work forms → PAUSE → user handles
5. **Hard daily cap** — check `global_daily_limit` in Redis before EVERY application. At 150, stop all processing and notify user
6. **CAPTCHA detected = pause** — detect CAPTCHA selectors → send WS notification → wait for user to resolve → resume
7. **Failed apply = never retry silently** — log failure → notify user → mark as `FAILED` with reason

## Playwright Session Management
```python
# services/auto-apply-agent/browser/session_manager.py
# Sessions are per-platform, reused within 30min, then rotated
# Each ECS task manages 3 concurrent browser sessions max

async def get_session(platform: str, user_id: str) -> BrowserSession:
    # Try to reuse existing session
    session = await redis.get(f"browser_session:{platform}:{user_id}")
    if session and not session.is_expired:
        return session
    # Create new session with fresh browser context
    return await create_fresh_session(platform, user_id)
```

## Form-Filling Decision Tree
```
For each form field:
  → Is it in user.profile? → Fill from profile
  → Is it in user.answer_memory_bank? → Fill from memory (if confidence > 0.8)
  → Is it a screening question? → Claude generates answer → show in review gate
  → Is it a sensitive field? (salary, legal, financial) → FLAG → pause → user fills
  → Is it a file upload? → Download from S3 → upload to form input
  → Unknown field? → Leave blank + log for answer memory bank training
```

## ATS Form Handlers (in ats/)
```
ats/
├── base.py           → BaseATSHandler abstract class
├── workday.py        → Workday handler (most complex — 3 step forms)
├── taleo.py          → Taleo handler (legacy — maintain but flag sunset)
├── greenhouse.py     → Greenhouse handler
├── lever.py          → Lever handler
├── icims.py          → iCIMS handler
├── linkedin.py       → LinkedIn Easy Apply handler
├── indeed.py         → Indeed Apply handler
└── generic.py        → Fallback handler for unknown ATS types
```

## Answer Memory Bank
```python
# When user edits an AI-suggested answer in the review gate:
# → Save the override to answer_memory_bank with question_fingerprint
# → Future applications: if fingerprint match > 0.85 cosine similarity → use stored answer
# → Never auto-apply stored answers for legal/sensitive questions
await update_answer_memory(
    user_id=user_id,
    question_fingerprint=hash_question(question_text),
    answer=user_override,
    source='user_override',
    confidence=1.0,
)
```

## Run Locally
```bash
cd services/auto-apply-agent
uv run python main.py
# WARNING: Playwright will open real browser sessions in local dev
# Use --dry-run flag to simulate without actually submitting
uv run python main.py --dry-run
uv run pytest tests/ -v
```
