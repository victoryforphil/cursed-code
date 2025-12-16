# Perplexity MCP Usage Guidelines

## Models & Cost Breakdown

### MCP Tools Available
- **perplexity_search** → Search API ($5/1K requests, raw results only)
- **perplexity_ask** → Sonar ($1/$1 in/out tokens + $5-12/1K request fee)
- **perplexity_research** → Sonar Deep Research ($2/$8 in/out tokens + $5-14/1K request fee, includes $5/1K search queries)
- **perplexity_reason** → Sonar Reasoning Pro ($2/$8 in/out tokens + $6-14/1K request fee)

### Cost Examples (Per Request)
- **perplexity_ask** (simple): ~$0.006-0.013 (cheapest)
- **perplexity_reason** (complex logic): ~$0.01-0.05 
- **perplexity_research** (deep dive): **$0.41-1.32** (most expensive - varies by context size)

## Rate Limits & Quotas (by Usage Tier)
Your Pro plan with extra credits likely puts you at **Tier 1-2+**. These are API rate limits per minute:

| Model | Tier 0 | Tier 1 | Tier 2 | Tier 3 |
|-------|--------|--------|--------|--------|
| sonar-deep-research | 5 | 10 | 20 | 40 |
| sonar-reasoning-pro | 50 | 50 | 500 | 1,000 |
| sonar (ask/search) | 50 | 50 | 500 | 1,000 |

*Higher tiers based on cumulative lifetime purchases ($50, $250, $500, etc.)*

## When to Use Each Tool

### ✅ Use research/reason tools for:
- Complex problems requiring deep investigation
- Multi-faceted topics needing comprehensive analysis
- Important decisions or high-stakes reasoning
- Novel problems without straightforward solutions
- When you need citations and detailed sources

### ❌ Avoid wasting on:
- Simple factual lookups (use `perplexity_search` instead)
- Quick clarifications or basic questions
- Repeated searches on same topic
- Tasks already well-solved with standard web search
- **Deep research costs 40-100x more than ask tool** - save it for legitimately complex needs

## Strategy
1. **Start with `perplexity_search`** - Raw API results ($0.005/request), no LLM processing
2. **Use `perplexity_ask`** - Quick conversational context ($0.006-0.013/request)
3. **Reserve `perplexity_reason`** - Complex reasoning problems ($0.01-0.05/request)
4. **Reserve `perplexity_research`** - Deep, exhaustive research only ($0.41-1.32/request!)

## Why Research is Expensive
Sonar Deep Research automatically:
- Performs multiple searches (18-30+ internal searches)
- Generates extensive reasoning tokens (70k-300k+)
- Creates comprehensive citations
- Returns thorough reports

**Result: 40-100x cost vs simple ask.** Use sparingly for genuinely complex investigations.

# Log
- 2024-12-15: Created usage guidelines for rate-limited Perplexity tools
