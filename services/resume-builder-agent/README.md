# Resume Builder Agent

AI-powered resume optimization service using 6 parallel sub-agents for comprehensive resume improvement.

## Overview

The Resume Builder Agent is an intelligent resume optimization pipeline that:

- **Extracts** resume data from PDF, LinkedIn profiles, forms, or voice input
- **Normalizes** inconsistent formatting and structure
- **Optimizes** with 6 parallel AI agents covering different aspects
- **Scores** ATS (Applicant Tracking System) compatibility with 23 checkpoints
- **Exports** in multiple formats (TXT, PDF, DOCX)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Resume Builder Workflow (LangGraph)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input → Extract → Normalize → Optimize → Score → Export   │
│                         ↓                                    │
│                    ┌────────────────────┐                   │
│                    │ 5 Parallel Agents  │                   │
│                    ├────────────────────┤                   │
│                    │ 1. Linguistic      │ (grammar, clarity)│
│                    │ 2. ATS Keyword     │ (keyword gaps)   │
│                    │ 3. Impact          │ (CAR/STAR)       │
│                    │ 4. Customization   │ (job-specific)   │
│                    │ 5. Formatting      │ (ATS-safe)       │
│                    └────────────────────┘                   │
│                           ↓                                 │
│                    Authenticity Agent (runs last)           │
│                    (detects AI phrases, clichés)            │
│                                                              │
│  23-Point ATS Scoring:                                      │
│  ├─ FORMATTING (5 checkpoints)   - fonts, margins, layout  │
│  ├─ STRUCTURE (5 checkpoints)    - headers, dates, order   │
│  ├─ CONTENT (6 checkpoints)      - grammar, voice, metrics │
│  ├─ KEYWORDS (4 checkpoints)     - skills, industry terms  │
│  └─ DESIGN (3 checkpoints)       - plain text, bullets      │
│                                                              │
│  Export Formats: TXT, PDF, DOCX                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Multi-Source Extraction
- **PDF**: Automatic section detection (Experience, Education, Skills)
- **Form**: Structured JSON input
- **LinkedIn**: Profile URL parsing (mock in dev)
- **Voice**: Audio transcription and parsing (future)

### 2. Six Optimization Agents

#### Linguistic Agent
- Grammar and spelling fixes
- Clarity improvements (remove awkward phrasing)
- Eliminate passive voice
- Reduce repetition and wordiness

#### ATS Keyword Agent
- Analyze job description for keywords
- Identify missing skills/keywords
- Suggest placement (skills, experience, summary)
- Optimize for ATS scanning

#### Impact Agent
- Transform achievements using STAR framework
- Add quantified metrics where possible
- Emphasize business impact
- Increase achievement specificity

#### Customization Agent
- Tailor resume for specific job
- Reorder achievements by relevance
- Emphasize matching skills
- Adjust language to match job posting

#### Formatting Agent
- Check date format consistency (MM/YYYY)
- Remove special characters that may not parse
- Validate section headers
- Fix bullet point inconsistencies
- Ensure ATS-safe formatting

#### Authenticity Agent (Runs Last)
- Detect AI-generated phrases ("synergize", "leverage", etc.)
- Identify clichés
- Preserve user's personal voice
- Flag unrealistic claims
- Ensure resume sounds genuine

### 3. ATS Compatibility Scoring

**23 Checkpoints across 5 categories:**

**FORMATTING (5 checkpoints)**
- ✓ Standard fonts (Arial, Calibri, Helvetica, Times New Roman)
- ✓ Single column layout (no tables)
- ✓ Standard margins (0.5-1 inch)
- ✓ No headers/footers
- ✓ Consistent spacing

**STRUCTURE (5 checkpoints)**
- ✓ Clear section headers (Experience, Education, Skills)
- ✓ Consistent date format
- ✓ Contact info at top
- ✓ Logical section order
- ✓ No graphics/images

**CONTENT (6 checkpoints)**
- ✓ Action verbs used (Led, Managed, Created)
- ✓ Quantified achievements with metrics
- ✓ Specific accomplishments (not generic)
- ✓ No spelling/grammar errors
- ✓ Active voice preferred
- ✓ Concise descriptions

**KEYWORDS (4 checkpoints)**
- ✓ Relevant technical/professional skills
- ✓ Industry-specific keywords present
- ✓ Job titles match standards
- ✓ No keyword stuffing/repetition

**DESIGN (3 checkpoints)**
- ✓ Plain text compatible (no special Unicode)
- ✓ Minimal formatting (bold/italic okay, not excessive)
- ✓ Standard bullet points only (-, •, *)

**Scoring Thresholds:**
- 🔴 **RED** (<60): Significant issues, cannot export
- 🟡 **YELLOW** (60-74): Acceptable but needs improvement, can export with warnings
- 🟢 **GREEN** (75+): Optimized and ready, export recommended

### 4. Export Formats

- **TXT**: Plain text (universal compatibility)
- **PDF**: Formatted with reportlab (preserves layout)
- **DOCX**: Microsoft Word (editable, professional formatting)

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ (for running alongside API backend)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd services/resume-builder-agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Dependencies

```
# Core
langraph>=0.1.0
pydantic>=2.0
pydantic-settings>=2.0

# PDF Processing
pdfplumber>=0.9.0
reportlab>=4.0.0

# Document Generation
python-docx>=0.8.11

# LLM Integration
anthropic>=0.20.0

# Async
aiohttp>=3.8.0
asyncio>=3.4.3

# Logging
python-json-logger>=2.0.0
```

## Usage

### Command Line

```bash
# Run the agent (uses example resume)
python src/main.py

# With environment variables
ANTHROPIC_API_KEY=sk-ant-... python src/main.py
```

### Python API

```python
import asyncio
from digital_fte_resume_builder import ResumeBuilderGraph, ResumeBuilderInput

async def optimize_resume():
    builder = ResumeBuilderGraph()

    input_data = ResumeBuilderInput(
        user_id="user_123",
        correlation_id="corr_abc123",
        source_type="pdf",
        source_data="/path/to/resume.pdf",
        target_job_description="Job description here...",
        export_formats=["txt", "pdf", "docx"]
    )

    results = await builder.run(input_data)
    return results

results = asyncio.run(optimize_resume())
print(f"ATS Score: {results['ats_score']['overall_score']}/100")
print(f"Exported: {results['export_paths']}")
```

### REST API Integration

The Resume Builder Agent integrates with the main API backend:

```bash
# Upload PDF and optimize
curl -X POST http://localhost:3000/resumes/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@resume.pdf"

# Score ATS compatibility
curl -X POST http://localhost:3000/resumes/{id}/score \
  -H "Authorization: Bearer <token>" \
  -d '{"targetJobDescription": "..."}'

# Export resume
curl -X GET http://localhost:3000/resumes/{id}/export?format=pdf \
  -H "Authorization: Bearer <token>" \
  > resume.pdf
```

## API Response Examples

### Resume Optimization Response

```json
{
  "success": true,
  "ats_score": {
    "overall_score": 82,
    "level": "GREEN",
    "checkpoint_count": 23,
    "blockers": [],
    "warnings": [
      "Consider adding more metrics to achievements"
    ]
  },
  "can_export": true,
  "export_messages": [
    "✅ Score is GREEN (75+). Resume is ATS-optimized and ready for export."
  ],
  "export_results": {
    "txt": {
      "success": true,
      "message": "Resume exported successfully to /tmp/resume.txt"
    },
    "pdf": {
      "success": true,
      "message": "Resume exported successfully to /tmp/resume.pdf"
    },
    "docx": {
      "success": true,
      "message": "Resume exported successfully to /tmp/resume.docx"
    }
  },
  "export_paths": {
    "txt": "/tmp/resume.txt",
    "pdf": "/tmp/resume.pdf",
    "docx": "/tmp/resume.docx"
  },
  "optimizations": {
    "total_applied": 27,
    "agents_run": [
      "Linguistic Agent",
      "ATS Keyword Agent",
      "Impact Agent",
      "Customization Agent",
      "Formatting Agent",
      "Authenticity Agent"
    ]
  },
  "duration_seconds": 18.5,
  "error": null
}
```

### ATS Score Detailed Response

```json
{
  "overall_score": 82,
  "level": "GREEN",
  "checkpoints": [
    {
      "name": "Standard fonts",
      "category": "formatting",
      "status": "pass",
      "weight": 0.05,
      "details": "Resume uses Arial font which is ATS-safe",
      "suggestion": null
    },
    {
      "name": "Quantified achievements",
      "category": "content",
      "weight": 0.08,
      "status": "warning",
      "details": "Some achievements lack specific metrics",
      "suggestion": "Add percentage increases or revenue figures to achievements"
    }
  ],
  "blockers": [],
  "warnings": [
    "Add metrics to 3 remaining achievements"
  ],
  "summary": "Resume is well-structured with strong content. ATS systems will parse it successfully."
}
```

## Performance Benchmarks

### Typical Processing Times

| Operation | Time | Notes |
|-----------|------|-------|
| PDF Extraction | 2-3s | Depends on length and formatting |
| Parallel Optimization | 8-12s | 5 agents run concurrently |
| Authenticity Check | 2-3s | Runs sequentially after other agents |
| ATS Scoring | 3-4s | 23-checkpoint analysis |
| PDF Export | 1-2s | reportlab rendering |
| **Total Workflow** | **16-24s** | End-to-end processing |

### Optimization Metrics

- **Grammar fixes**: 2-8 corrections per resume
- **ATS keywords**: 3-7 missing keywords identified
- **Metrics added**: 2-5 achievements enhanced with numbers
- **Formatting issues**: 0-3 style corrections
- **Authenticity concerns**: 0-2 AI-generated phrases flagged

## Error Handling

The agent handles errors gracefully:

```python
{
  "success": false,
  "ats_score": null,
  "can_export": false,
  "export_messages": [
    "❌ Score is RED (<60). Resume needs significant improvement."
  ],
  "error": "PDF extraction failed: Invalid file format"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid file format" | Non-PDF file uploaded | Ensure file is valid PDF |
| "ATS scoring failed" | JSON parsing error | Check LLM API connectivity |
| "Export failed" | Insufficient permissions | Check file write permissions |
| "Extraction timeout" | Large/complex PDF | Split into smaller sections |

## Configuration

### Environment Variables

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# AWS (for S3 storage)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Application
RESUME_OUTPUT_DIR=/tmp/resumes
MAX_RESUME_SIZE_MB=10
EXPORT_FORMATS=txt,pdf,docx
LOG_LEVEL=INFO
```

### Job Description Optimization

When providing a target job description:
1. The ATS Keyword Agent analyzes job posting for key skills
2. The Customization Agent reorders achievements by relevance
3. The system generates specific improvement suggestions
4. ATS score includes job-specific recommendations

## Workflow States

```
INIT → EXTRACTING → NORMALIZING → OPTIMIZING → SCORING → EXPORTING → COMPLETE
                                        ↓
                            [5 Parallel Agents]
                            [Then Authenticity]
                                        ↓
                                   OPTIMIZED
```

## Limitations and Future Enhancements

### Current Limitations
- Voice extraction not yet implemented
- LinkedIn profile parsing is mocked (requires official API)
- No video/multimedia section support
- ATS scoring based on heuristics (not actual ATS system testing)

### Planned Enhancements
- LinkedIn API integration (real profiles)
- Voice transcription and parsing
- Real ATS system testing integration
- Taleo/Workday parser detection
- Cover letter generation based on job description
- Interview preparation based on resume
- Salary negotiation insights
- Multi-language support

## Testing

```bash
# Run main.py with test data
python src/main.py

# Run with custom resume
python -c "
import asyncio
from main import build_and_optimize_resume

results = asyncio.run(build_and_optimize_resume(
    user_id='test_user',
    correlation_id='test_123',
    source_type='form',
    source_data={'full_name': 'Jane Doe'},
    target_job_description='Senior Engineer'
))
print(results)
"
```

## Integration with Main Platform

### REST Endpoints

The Resume Builder Agent is integrated into the main API platform at:

```
POST   /resumes/upload         - Upload and optimize resume
GET    /resumes/list           - List user's resumes
GET    /resumes/:id            - Get resume details
POST   /resumes/:id/score      - Run ATS scoring
POST   /resumes/:id/optimize   - Run optimization
GET    /resumes/:id/export     - Export in format
DELETE /resumes/:id            - Delete resume
```

### Database Integration

Resumes are stored in the `ResumeProfile` table:

```sql
CREATE TABLE ResumeProfile (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES User(id),
  name VARCHAR(255),
  extractedData JSONB,
  atsScore JSONB,
  optimizations JSONB,
  exportedFormats JSON[],
  s3Paths JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

## Architecture Decisions

### Why 6 Agents?
- **Division of Concerns**: Each agent focuses on specific optimization dimension
- **Parallel Execution**: 5 agents run simultaneously for performance
- **Authenticity Check**: Authenticity agent runs last to catch over-optimization
- **Extensibility**: Easy to add new agents for new optimization types

### Why LangGraph?
- **State Management**: Clear workflow state tracking
- **Error Handling**: Built-in error recovery and retries
- **Async/Await**: Native async support for parallel processing
- **Auditability**: Full execution trace for debugging

### Why 23 Checkpoints for ATS?
- **Comprehensive**: Covers all major ATS parsing categories
- **Weighted**: Different checkpoints have different impacts
- **Actionable**: Each checkpoint has specific suggestions
- **Industry Standard**: Aligned with ATS parser documentation

## Security Considerations

- PII is masked in logs and LLM inputs
- File uploads are scanned for malware
- All LLM API calls use HTTPS
- No resume data stored in memory after export
- Credentials never logged or exposed
- S3 uploads use server-side encryption

## Support

For issues or feature requests:
- GitHub Issues: [project-issues-url]
- Documentation: [docs-url]
- Email: support@digital-fte.com

## License

Copyright © 2024 Digital FTE. All rights reserved.
