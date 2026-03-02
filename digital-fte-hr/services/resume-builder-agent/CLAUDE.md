# Resume Builder Agent — Local Context
# This CLAUDE.md is for: services/resume-builder-agent/
# Inherits root CLAUDE.md + adds resume-specific rules

## What This Service Does
Multi-input resume builder (PDF upload, LinkedIn URL, form, voice) → LLM extraction →
6-sub-agent optimization pipeline → 23-checkpoint ATS scoring → export to PDF/DOCX/TXT.
This is the most complex service — 60+ LLM prompts in the optimization pipeline.

## Tech Stack (This Service)
- **Language**: Python 3.12 + Node.js (for DOCX generation via docx-js)
- **LLM**: Claude 3.5 Sonnet for all generation/optimization tasks
- **Voice**: OpenAI Whisper API (transcription) → AWS Transcribe (fallback)
- **PDF Parse**: PyMuPDF (fitz) + pdfplumber for complex layouts
- **DOCX Parse**: python-docx for reading, docx-js (Node) for generating
- **PDF Export**: WeasyPrint (HTML → PDF) with Jinja2 templates
- **Sub-agents**: 6 parallel LangGraph sub-agents (see below)

## The 6 Sub-Agents (Run in Parallel)
```
1. LinguisticAgent    → grammar, clarity, passive voice removal, sentence quality
2. ATSKeywordAgent    → keyword gap analysis, injection, density checking
3. ImpactAgent        → achievement quantification, CAR/STAR reframing
4. CustomizationAgent → job-description tailoring, relevance reordering
5. FormattingAgent    → ATS-safe formatting, heading standardization
6. AuthenticityAgent  → preserve user voice, remove AI-sounding phrases (runs LAST)
```

## Critical Rules (This Service)
1. **AuthenticityAgent always runs last** — it reviews and softens changes from all other agents
2. **Never remove content without showing diff** — all changes tracked in `changes[]` array
3. **User can reject any individual change** — store each change with `accepted: null` by default
4. **ATS score must be recomputed after EVERY optimization** — never use cached score
5. **Voice recordings deleted from S3 within 24hr** — Lambda cleanup job handles this
6. **Preserve original resume version** — always create new version, never overwrite
7. **Export validation** — test PDF is readable by 3+ ATS parsers before returning URL

## Voice Input Pipeline
```python
# Flow: Audio → S3 → Whisper → Extraction → Profile
# 1. Client uploads audio to S3 (pre-signed URL)
# 2. S3 event triggers Lambda
# 3. Lambda calls Whisper API (max 25MB file)
# 4. Raw transcript → Claude extraction prompt (voice_extraction.md)
# 5. Claude extracts structured career data as JSON
# 6. JSON → resume profile creation → ATS scoring
# Always send "processing" status update via WebSocket during steps 3-5
```

## Prompt Files (in prompts/)
```
prompts/
├── system.md                    → Agent system prompt
├── extraction/
│   ├── pdf_extraction.md        → Extract from PDF text
│   ├── linkedin_extraction.md   → Extract from LinkedIn HTML
│   ├── voice_extraction.md      → Extract from voice transcript
│   └── form_normalization.md    → Normalize manual form input
├── optimization/
│   ├── linguistic.md            → LinguisticAgent prompt
│   ├── ats_keywords.md          → ATSKeywordAgent prompt
│   ├── impact.md                → ImpactAgent prompt
│   ├── customization.md         → CustomizationAgent prompt
│   ├── formatting.md            → FormattingAgent prompt
│   └── authenticity.md          → AuthenticityAgent prompt (CRITICAL: run last)
├── scoring/
│   └── ats_score.md             → 23-checkpoint scoring prompt
└── cover_letter.md              → Cover letter generation prompt
```

## ATS Score Checkpoints (All 23 — Must All Pass for Green)
See @docs/agent-contracts.md for full checkpoint list.
Score thresholds: <60 = RED (block export), 60-74 = YELLOW (warn), 75+ = GREEN (allow export)

## Run Locally
```bash
cd services/resume-builder-agent
uv run python main.py
uv run pytest tests/ -v
uv run python -m scripts.test_extraction --file sample.pdf  # Test extraction
uv run python -m scripts.test_optimization --profile-id test_123  # Test pipeline
```
