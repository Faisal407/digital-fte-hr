---
name: job-matcher
description: Implements the Digital FTE 6-dimension job matching algorithm that calculates match scores (0-100) between a user's profile and job listings. Use when building or modifying the match scoring logic, score breakdown API, job ranking, or ghost job detection. Knows all 6 dimensions, their weights, and the ghost job detection heuristics.
---

# Job Matcher Skill — Digital FTE Match Score Engine

## The 6 Match Dimensions

| # | Dimension | Weight | What It Measures |
|---|---|---|---|
| 1 | Skills Match | 35% | Technical skills overlap between user profile and JD |
| 2 | Experience Match | 25% | Years of experience and seniority alignment |
| 3 | Location Match | 15% | Geographic fit (city, country, remote preference) |
| 4 | Education Match | 10% | Degree level and field relevance |
| 5 | Salary Match | 10% | Overlap between user's target salary and JD range |
| 6 | Culture Match | 5% | Company size, industry, work style alignment |

## Overall Score Formula

```python
overall_score = (
    skills_score      * 0.35 +
    experience_score  * 0.25 +
    location_score    * 0.15 +
    education_score   * 0.10 +
    salary_score      * 0.10 +
    culture_score     * 0.05
)
# Clamp to 0-100 integer
overall_score = max(0, min(100, round(overall_score)))
```

## Dimension Scoring Logic

### 1. Skills Match (0-100)

```python
def score_skills(user_skills: list[str], jd_required: list[str], jd_nice: list[str]) -> int:
    """
    Required skills: 80% weight
    Nice-to-have:    20% weight
    """
    def normalize(skill: str) -> str:
        return skill.lower().strip()

    user_set = {normalize(s) for s in user_skills}

    # Expand with synonyms (loaded from skills_synonyms.json)
    user_expanded = expand_with_synonyms(user_set)

    # Required skills match
    req_matched = sum(1 for s in jd_required if normalize(s) in user_expanded)
    req_score = (req_matched / len(jd_required) * 100) if jd_required else 100

    # Nice-to-have match
    nice_matched = sum(1 for s in jd_nice if normalize(s) in user_expanded)
    nice_score = (nice_matched / len(jd_nice) * 100) if jd_nice else 100

    return round(req_score * 0.80 + nice_score * 0.20)
```

### 2. Experience Match (0-100)

```python
def score_experience(user_yoe: float, jd_min_years: float, jd_max_years: float | None) -> int:
    """
    Exact match in range = 100
    Slightly under (within 1yr) = 70
    Over-qualified (>3yr above max) = 80 (penalty for over-qualification)
    Significantly under = scales linearly to 0
    """
    if jd_max_years is None:
        jd_max_years = jd_min_years + 5  # Assume open-ended

    if jd_min_years <= user_yoe <= jd_max_years:
        return 100

    if user_yoe < jd_min_years:
        gap = jd_min_years - user_yoe
        if gap <= 1:    return 70   # Close enough
        if gap <= 2:    return 50
        if gap <= 3:    return 30
        return max(0, int(30 - (gap - 3) * 10))

    # Over-qualified
    over = user_yoe - jd_max_years
    if over <= 2:    return 95
    if over <= 5:    return 85
    return 75   # Very over-qualified — still hireable
```

### 3. Location Match (0-100)

```python
def score_location(
    user_location: str, user_remote_ok: bool,
    job_location: str,  job_remote: bool
) -> int:
    # Remote job + user accepts remote = perfect
    if job_remote and user_remote_ok:
        return 100

    # Same city
    if normalize_city(user_location) == normalize_city(job_location):
        return 100

    # Same country
    if extract_country(user_location) == extract_country(job_location):
        return 75

    # Gulf Cooperation Council (GCC) cross-border (common in Digital FTE's markets)
    GCC = {'UAE','Saudi Arabia','Kuwait','Qatar','Bahrain','Oman'}
    if extract_country(user_location) in GCC and extract_country(job_location) in GCC:
        return 60

    # South Asia (Pakistan ↔ Bangladesh ↔ India — common mobility)
    SOUTH_ASIA = {'Pakistan','Bangladesh','India','Sri Lanka','Nepal'}
    if extract_country(user_location) in SOUTH_ASIA and extract_country(job_location) in SOUTH_ASIA:
        return 50

    # International (user open to relocation — infer from profile)
    if user_remote_ok:
        return 35  # Shows flexibility even for non-remote roles

    return 20
```

### 4. Salary Match (0-100)

```python
def score_salary(
    user_min: float, user_max: float,
    jd_min: float | None, jd_max: float | None,
    currency: str = "USD"
) -> int:
    if jd_min is None or jd_max is None:
        return 70  # Unknown JD salary — neutral score

    # Normalize to USD if needed
    user_min_usd = convert_to_usd(user_min, currency)
    user_max_usd = convert_to_usd(user_max, currency)

    # Overlap calculation
    overlap_low  = max(user_min_usd, jd_min)
    overlap_high = min(user_max_usd, jd_max)

    if overlap_high >= overlap_low:
        # There is salary overlap — score by how much
        overlap_ratio = (overlap_high - overlap_low) / (user_max_usd - user_min_usd + 1)
        return min(100, round(60 + overlap_ratio * 40))

    # No overlap — penalty based on gap
    if user_min_usd > jd_max:
        gap_pct = (user_min_usd - jd_max) / user_min_usd
        return max(0, round(50 - gap_pct * 100))

    # User asks for less than JD minimum — good for employer, slight penalty for user
    return 80
```

## Ghost Job Detection

```python
GHOST_JOB_SIGNALS = {
    "days_posted": 30,           # Posted > 30 days ago = flag
    "apply_url_broken": True,    # 404 on apply URL
    "duplicate_postings": 3,     # Same role posted 3+ times by same company
    "company_layoffs_recent": True,  # Company had layoffs in last 90 days
    "no_salary": True,           # High-volume ghost posters rarely show salary
}

def detect_ghost_job(job: dict, company_data: dict) -> tuple[bool, list[str]]:
    signals = []

    days_since_posted = (datetime.now(UTC) - job["posted_at"]).days
    if days_since_posted > 30:
        signals.append(f"Posted {days_since_posted} days ago — may be stale or evergreen")

    if company_data.get("had_layoffs_90d"):
        signals.append("Company reported layoffs in the last 90 days")

    if job.get("duplicate_count", 0) >= 3:
        signals.append(f"This role has been posted {job['duplicate_count']} times")

    is_ghost = len(signals) >= 2   # 2+ signals = ghost job
    return is_ghost, signals
```

## Match Score API Response

```json
{
  "jobId": "uuid",
  "matchScore": 82,
  "scoreBreakdown": {
    "skills":     90,
    "experience": 85,
    "location":   100,
    "education":  75,
    "salary":     60,
    "culture":    80
  },
  "topStrengths": [
    "Strong skills alignment — 9/11 required skills matched",
    "Location: same city (Dubai)"
  ],
  "topGaps": [
    "Salary: your target exceeds JD range by ~15%",
    "Missing skill: Salesforce CRM"
  ],
  "isGhostJob": false,
  "ghostJobSignals": []
}
```

## Rules

- Match scores are ALWAYS integers 0-100 — never floats, never null
- Ghost jobs are flagged but NEVER hidden from results — user decides
- Skill synonym expansion uses `data/skills_synonyms.json` — always update this file when adding new platforms
- Location scoring must account for GCC and South Asia cross-border mobility (Digital FTE's primary markets)
- Salary comparison always converts to USD first using daily rate from `lib/currency.py`
- Scores are recomputed daily for saved jobs (salary/location data can change)

## Vector Semantic Matching with OpenSearch + Titan Embeddings (M-3 Fix)

```python
# services/job-search-agent/scoring/vector_matcher.py
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

COSINE_THRESHOLD = 0.72  # Matches above this are surfaced as candidates

class VectorMatcher:

    def __init__(self):
        credentials = boto3.Session().get_credentials()
        region = os.environ['AWS_REGION']
        auth = AWS4Auth(credentials=credentials, region=region, service='aoss')
        endpoint = os.environ['OPENSEARCH_ENDPOINT']
        self.client = OpenSearch(
            hosts=[{ 'host': endpoint, 'port': 443 }],
            http_auth=auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
        )
        self.bedrock = boto3.client('bedrock-runtime', region_name=region)

    async def embed(self, text: str) -> list[float]:
        """Generate 1536-dim embedding using Amazon Titan Embeddings v2."""
        response = self.bedrock.invoke_model(
            modelId='amazon.titan-embed-text-v2:0',
            body=json.dumps({ "inputText": text, "dimensions": 1536, "normalize": True }),
        )
        return json.loads(response['body'].read())['embedding']

    async def find_matching_jobs(self, resume_text: str, filters: dict, top_k: int = 50) -> list[dict]:
        """Semantic job search — returns jobs sorted by cosine similarity to resume."""
        resume_embedding = await self.embed(resume_text)

        query = {
            "size": top_k,
            "query": {
                "bool": {
                    "must": [
                        { "knn": { "embedding": { "vector": resume_embedding, "k": top_k * 2 } } }
                    ],
                    "filter": [
                        { "term":  { "isGhost": False } },
                        { "range": { "postedAt": { "gte": "now-30d" } } },
                        *([{ "term": { "platform": p } } for p in filters.get("platforms", [])] if filters.get("platforms") else []),
                    ]
                }
            }
        }
        response = self.client.search(index='job-listings', body=query)
        hits     = response['hits']['hits']

        # Filter by cosine threshold + return with similarity scores
        return [
            { **hit['_source'], 'semanticScore': hit['_score'] }
            for hit in hits
            if hit['_score'] >= COSINE_THRESHOLD
        ]
```
