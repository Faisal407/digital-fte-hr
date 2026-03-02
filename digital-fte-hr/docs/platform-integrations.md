# Platform Integration Details
# Reference document — load with @docs/platform-integrations.md when building scrapers/integrations

## Tier 1: Official API Integrations

### LinkedIn Jobs API
- Docs: https://developer.linkedin.com/docs/guide/v2/jobs
- Auth: OAuth 2.0 — user grants permission → platform stores access token in Secrets Manager
- Key endpoints: GET /v2/jobSearch, GET /v2/jobs/{id}
- Easy Apply: POST /v2/simpleJobApplications
- Rate limit: 100 req/day per app (LinkedIn partner review increases this — apply at launch)
- Gotcha: LinkedIn frequently changes field names — always use versioned API (X-Restli-Protocol-Version: 2.0.0)
- Token refresh: 60-day access tokens — implement proactive refresh at 50 days

### Indeed Publisher API
- Docs: https://opensource.indeedeng.io/api-documentation/
- Auth: Publisher ID + API key (server-side only)
- Key endpoint: GET https://api.indeed.com/ads/apisearch
- Apply: Redirect to Indeed apply page — no API apply (use Playwright for Indeed Easy Apply)
- Rate limit: Per publisher agreement — default 20 req/min

### Greenhouse Job Board API
- Docs: https://developers.greenhouse.io/job-board.html
- Public API (no auth needed for job search)
- Endpoint: GET https://boards-api.greenhouse.io/v1/boards/{company_token}/jobs
- Apply: POST https://boards-api.greenhouse.io/v1/applications
- Gotcha: Each company has different Greenhouse subdomain — build company→token lookup table

### Lever Postings API
- Docs: https://github.com/lever/postings-api
- Public API for job listings
- Apply: POST https://api.lever.co/v0/postings/{company}/{id}/apply

## Tier 2: Playwright Scrapers

### NaukriGulf (naukrigulf.com)
```python
# services/job-search-agent/scrapers/naukrigulf.py
# Key selectors (as of 2026-03 — MUST update if site changes)
JOB_LIST_SELECTOR = "div.job-listing-container article.job-card"
JOB_TITLE_SELECTOR = "h2.job-title a"
COMPANY_SELECTOR = "span.company-name"
LOCATION_SELECTOR = "span.job-location"
SALARY_SELECTOR = "span.salary-range"  # Often absent
APPLY_BTN_SELECTOR = "button[data-testid='apply-btn']"

# Auth: User provides NaukriGulf credentials → stored encrypted in Secrets Manager
# Session: Reuse session cookies (store in Redis, TTL 24hr)
# Rate limit: 60 req/hr per user account — use token bucket
```

### Bayt.com
```python
# services/job-search-agent/scrapers/bayt.py
SEARCH_URL = "https://www.bayt.com/en/jobs/?q={query}&l={location}"
JOB_CARD_SELECTOR = "li.has-pointer-d"
# Bayt uses infinite scroll — Playwright must scroll and wait for network idle
# Apply: Multi-step form — stored field mapping in bayt_form_schema.json
```

### Rozee.pk
```python
# services/job-search-agent/scrapers/rozee.py
SEARCH_URL = "https://www.rozee.pk/job/jsearch/q/{query}/fc/{location_code}"
# Note: Rozee requires user account login for apply
# Location codes: Lahore=5, Karachi=1, Islamabad=2, Rawalpindi=3
```

## Tier 3: Enterprise ATS Browser Automation

### Workday Auto-Fill
```python
# services/auto-apply-agent/ats/workday.py
# Workday URLs always follow: https://{company}.wd{n}.myworkdayjobs.com/
WORKDAY_DOMAIN_PATTERN = r"\.wd\d+\.myworkdayjobs\.com"

# Field mapping (Workday uses consistent field IDs across all companies)
WORKDAY_FIELDS = {
    "firstName": "input[data-automation-id='legalNameSection_firstName']",
    "lastName": "input[data-automation-id='legalNameSection_lastName']",
    "email": "input[data-automation-id='email']",
    "phone": "input[data-automation-id='phone']",
    "resume": "input[type='file'][data-automation-id='file-upload-input']",
    "coverLetter": "textarea[data-automation-id='coverLetter']",
}
# Workday has CAPTCHA on some instances — detect and pause for user
CAPTCHA_SELECTOR = "div.g-recaptcha, iframe[title='reCAPTCHA']"
```

### Taleo Auto-Fill
```python
# services/auto-apply-agent/ats/taleo.py
# Taleo URLs: https://jobs.taleo.net/{company}/ or https://{company}.taleo.net/
TALEO_DOMAIN_PATTERNS = [r"\.taleo\.net", r"taleo\.net/careersection"]
# Warning: Taleo is being deprecated — Oracle moving to Fusion HCM
# Still widely used until 2027 — maintain but flag for sunset
```

### Greenhouse Auto-Fill (Playwright fallback)
```python
# Used when Greenhouse API apply fails
GREENHOUSE_FIELDS = {
    "firstName": "input#first_name",
    "lastName": "input#last_name",
    "email": "input#email",
    "phone": "input#phone",
    "resume": "input#resume",
    "coverLetter": "textarea#cover_letter_text",
}
```

## Playwright Browser Configuration
```python
# packages/shared/browser_config.py — USE THIS — never configure Playwright manually
BROWSER_CONFIG = {
    "headless": True,          # False for debugging only
    "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",  # Required for ECS Fargate
    ],
    "user_agent": get_rotating_user_agent(),  # Rotate from list of real UAs
    "viewport": {"width": 1280, "height": 800},
    "locale": "en-US",
    "timezone_id": "America/New_York",
}
# Browser pool: 5 concurrent Playwright instances per ECS task
# Screenshot on every successful submit — stored to S3 as proof of application
```
