# Feature: Librarian Agent

**Source:** `/Users/vfp/repos/oh-my-opencode/src/agents/librarian.ts`
**Lines:** ~240 | **Dependencies:** context7, websearch_exa, grep_app, GitHub CLI | **Complexity:** High

## What It Does

The Librarian agent answers questions about open-source libraries by finding code evidence with GitHub permalinks. It's a specialized subagent for multi-repository analysis, remote codebase exploration, official documentation retrieval, and finding real-world implementation examples. Use it when users need to understand library internals, find usage patterns in open source, or explain how third-party code works.

## How It Works

1. **Request Classification** (mandatory first step)
   - Analyzes incoming question to determine request type: Conceptual, Implementation, Context, or Comprehensive
   - This classification determines which tools to use and how to parallelize execution

2. **Tool Selection by Type**
   - TYPE A (Conceptual): context7 docs + websearch_exa + grep_app in parallel (3+ calls)
   - TYPE B (Implementation): Clone repo, search source, get commit SHA for permalinks (4+ calls)
   - TYPE C (Context): Issues, PRs, git history/blame in parallel (4+ calls)
   - TYPE D (Comprehensive): All tools in parallel (6+ calls)

3. **Evidence Gathering**
   - Executes tools in parallel to accelerate research
   - Clones repositories to temp directory for local file inspection
   - Retrieves commit SHAs for constructing permanent GitHub permalinks
   - Searches across multiple dimensions (docs, code, history)

4. **Citation & Synthesis**
   - Constructs GitHub permalinks linking to specific line ranges
   - Presents evidence first, then explanation
   - Ensures every code claim includes proof

5. **Date Awareness**
   - Automatically uses current year (2025+) in searches
   - Filters out outdated results
   - Prevents false information from 2024 results

## Code Analysis

### Core Agent Configuration
```typescript
// src/agents/librarian.ts:3-9
export const librarianAgent: AgentConfig = {
  description:
    "Specialized codebase understanding agent for multi-repository analysis...",
  mode: "subagent",
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,  // Low temp: factual, precise, no hallucination
  tools: { write: false, edit: false, background_task: false },
  // write/edit: false because agent only gathers evidence, doesn't modify code
  // background_task: false because this needs synchronous tool execution
```

**Why this config:**
- Subagent mode allows it to be launched from parent agents
- Low temperature (0.1) for factual accuracy and deterministic results
- Claude Sonnet 4.5: Fast enough for parallel tool execution, good code understanding
- Tools disabled except built-in (context7, grep_app, websearch_exa, GitHub CLI)

### Request Classification Pattern
```typescript
// src/agents/librarian.ts:26-35
Classify EVERY request into one of these categories:

| Type | Trigger Examples | Tools |
|------|------------------|-------|
| **TYPE A: CONCEPTUAL** | "How do I use X?", "Best practice for Y?" | context7 + websearch_exa |
| **TYPE B: IMPLEMENTATION** | "How does X implement Y?", "Show me source of Z" | gh clone + read + blame |
| **TYPE C: CONTEXT** | "Why was this changed?", "History of X?" | gh issues/prs + git log |
| **TYPE D: COMPREHENSIVE** | Complex/ambiguous requests | ALL tools in parallel |
```

**Pattern in action:**
```
User: "How do I debounce in React?"
→ TYPE A: Conceptual
→ Execute: context7_get-library-docs + websearch_exa + grep_app in parallel

User: "Show me how useState implements hooks"
→ TYPE B: Implementation
→ Execute: gh clone + find source + git blame + context7 docs in parallel

User: "Why did React remove createContext from hooks?"
→ TYPE C: Context
→ Execute: gh search issues/prs + git log + git blame in parallel
```

### TYPE A: Conceptual Question Execution
```typescript
// src/agents/librarian.ts:41-52
Execute in parallel (3+ calls):
Tool 1: context7_resolve-library-id("library-name")
        → then context7_get-library-docs(id, topic: "specific-topic")
Tool 2: websearch_exa_web_search_exa("library-name topic 2025")
Tool 3: grep_app_searchGitHub(query: "usage pattern", language: ["TypeScript"])
```

**Key insight:** Parallel execution means all three tools run simultaneously. By the time one completes, others are still searching. Never execute sequentially for TYPE A.

### TYPE B: Implementation Reference (Sequence + Parallel Acceleration)
```typescript
// src/agents/librarian.ts:56-82
Step 1: Clone to temp directory
        gh repo clone owner/repo ${TMPDIR:-/tmp}/repo-name -- --depth 1
        
Step 2: Get commit SHA for permalinks
        cd ${TMPDIR:-/tmp}/repo-name && git rev-parse HEAD
        
Step 3: Find the implementation
        - grep/ast_grep_search for function/class
        - read the specific file
        - git blame for context if needed
        
Step 4: Construct permalink
        https://github.com/owner/repo/blob/<sha>/path/to/file#L10-L20

Parallel acceleration (4+ calls):
Tool 1: gh repo clone owner/repo ${TMPDIR:-/tmp}/repo -- --depth 1
Tool 2: grep_app_searchGitHub(query: "function_name", repo: "owner/repo")
Tool 3: gh api repos/owner/repo/commits/HEAD --jq '.sha'
Tool 4: context7_get-library-docs(id, topic: "relevant-api")
```

**Pattern breakdown:**
- Clone is slow but starts first (--depth 1 for speed)
- While cloning, grep_app searches for the function in parallel
- Get commit SHA in parallel for permalink construction
- Get official docs in parallel for API reference
- By the time clone finishes, you already have SHA and grep results ready

### TYPE C: Context & History (4+ Parallel Calls)
```typescript
// src/agents/librarian.ts:86-104
Tool 1: gh search issues "keyword" --repo owner/repo --state all --limit 10
Tool 2: gh search prs "keyword" --repo owner/repo --state merged --limit 10
Tool 3: gh repo clone owner/repo ${TMPDIR:-/tmp}/repo -- --depth 50
        → then: git log --oneline -n 20 -- path/to/file
        → then: git blame -L 10,30 path/to/file
Tool 4: gh api repos/owner/repo/releases --jq '.[0:5]'

// For specific issue/PR context:
gh issue view <number> --repo owner/repo --comments
gh pr view <number> --repo owner/repo --comments
```

**Use case:** Understanding why a feature exists, when it was added, what related issues discuss it.

### TYPE D: Comprehensive Research (6+ Parallel Calls)
```typescript
// src/agents/librarian.ts:108-126
// Documentation & Web
Tool 1: context7_resolve-library-id → context7_get-library-docs
Tool 2: websearch_exa_web_search_exa("topic recent updates")

// Code Search
Tool 3: grep_app_searchGitHub(query: "pattern1", language: [...])
Tool 4: grep_app_searchGitHub(query: "pattern2", useRegexp: true)

// Source Analysis
Tool 5: gh repo clone owner/repo ${TMPDIR:-/tmp}/repo -- --depth 1

// Context
Tool 6: gh search issues "topic" --repo owner/repo
```

**Pattern:** Max parallelization for complex requests. All tools run simultaneously.

### Mandatory Citation Format
```typescript
// src/agents/librarian.ts:132-146
**Claim**: [What you're asserting]

**Evidence** ([source](https://github.com/owner/repo/blob/<sha>/path#L10-L20)):
\`\`\`typescript
// The actual code
function example() { ... }
\`\`\`

**Explanation**: This works because [specific reason from the code].
```

**Why this format:**
- Claim first (what we're proving)
- Evidence with permalink (where to verify)
- Code snippet (what we're citing)
- Explanation (why it matters)
- User can click permalink to verify on GitHub

### Permalink Construction
```typescript
// src/agents/librarian.ts:148-160
https://github.com/<owner>/<repo>/blob/<commit-sha>/<filepath>#L<start>-L<end>

Example:
https://github.com/tanstack/query/blob/abc123def/packages/react-query/src/useQuery.ts#L42-L50

Getting SHA:
- From clone: git rev-parse HEAD
- From API: gh api repos/owner/repo/commits/HEAD --jq '.sha'
- From tag: gh api repos/owner/repo/git/refs/tags/v1.0.0 --jq '.object.sha'
```

**Key detail:** Permalinks use commit SHA, not branch names. This ensures links never break even if code changes.

### Parallel Execution Requirements
```typescript
// src/agents/librarian.ts:196-215
| Request Type | Minimum Parallel Calls |
|--------------|----------------------|
| TYPE A (Conceptual) | 3+ |
| TYPE B (Implementation) | 4+ |
| TYPE C (Context) | 4+ |
| TYPE D (Comprehensive) | 6+ |

Always vary queries when using grep_app:
// GOOD: Different angles
grep_app_searchGitHub(query: "useQuery(", language: ["TypeScript"])
grep_app_searchGitHub(query: "queryOptions", language: ["TypeScript"])
grep_app_searchGitHub(query: "staleTime:", language: ["TypeScript"])

// BAD: Same pattern
grep_app_searchGitHub(query: "useQuery")
grep_app_searchGitHub(query: "useQuery")
```

**Pattern insight:** Each grep_app call targets a different angle of the same problem. This increases chance of finding relevant examples across diverse codebases.

### Failure Recovery
```typescript
// src/agents/librarian.ts:219-227
| Failure | Recovery Action |
|---------|-----------------|
| context7 not found | Clone repo, read source + README directly |
| grep_app no results | Broaden query, try concept instead of exact name |
| gh API rate limit | Use cloned repo in temp directory |
| Repo not found | Search for forks or mirrors |
| Uncertain | **STATE YOUR UNCERTAINTY**, propose hypothesis |
```

**Pattern:** Each failure has a specific fallback. Never give up; pivot to next available tool.

### Date Awareness (Critical)
```typescript
// src/agents/librarian.ts:16-22
**CURRENT YEAR CHECK**: Before ANY search, verify the current date from environment context.
- **NEVER search for 2024** - It is NOT 2024 anymore
- **ALWAYS use current year** (2025+) in search queries
- When searching: use "library-name topic 2025" NOT "2024"
- Filter out outdated 2024 results when they conflict with 2025 information
```

**Why critical:** APIs change rapidly. A 2024 pattern might be deprecated in 2025. This prevents hallucination of old code.

## Implementation Details

### Event Lifecycle
- **Launch**: Parent agent calls Librarian as subagent with research request
- **Phase 0**: Classify request type (no tool execution yet)
- **Phase 1**: Execute tools in parallel based on type (3-6+ simultaneous calls)
- **Phase 2**: Synthesize evidence with permalinks
- **Return**: Evidence-backed answer to parent agent

### Tool Integration Points
| Tool | Purpose | When Used |
|------|---------|-----------|
| **context7** | Official library documentation | TYPE A, B, D |
| **websearch_exa** | Web search for recent info | TYPE A, D |
| **grep_app** | Search code across GitHub | TYPE A, B, C, D |
| **GitHub CLI** | Clone repos, view issues/PRs, get commits | TYPE B, C |
| **git** | Local history analysis (blame, log) | TYPE B, C |
| **webfetch** | Fetch blog posts, SO threads | TYPE D (fallback) |

### State Tracking
- **Request type**: Determined once, used to select tool set
- **Commit SHA**: Extracted once per repo, used for all permalinks
- **Temp directory**: Reused across multiple tool calls for same repo
- **Query variations**: Tracked to avoid duplicate grep_app searches

### Cleanup
- Temp directory clones are automatically cleaned up by OS
- No persistent state between requests
- Each request is independent

## Key Patterns

### Parallel Tool Execution Pattern
The agent uses **mandatory parallelization** - not optional. Each request type has a minimum number of simultaneous tool calls. This is critical for performance.

**Pattern:**
```
REQUEST
  ↓
CLASSIFY TYPE
  ↓
LAUNCH N PARALLEL TOOLS (3-6+)
  ↓
WAIT FOR ALL TO COMPLETE
  ↓
SYNTHESIZE EVIDENCE
  ↓
CITE WITH PERMALINKS
```

**Why it works:** By running tools in parallel, what would take 30 seconds sequentially takes 3-5 seconds total.

### Evidence-First Communication
Never say "I think" or "probably". Always start with evidence and permalink. This is the opposite of how most agents communicate.

**Pattern:**
```
WRONG: "I think React uses a virtual DOM for performance..."
RIGHT: "React uses a virtual DOM [evidence](link): [code block] because..."
```

### Failure Pivot Strategy
If one tool fails, immediately pivot to alternative. Never block on a single tool.

**Pattern:**
```
Tool A fails → Try Tool B
Tool B fails → Try Tool C  
Tool C fails → STATE UNCERTAINTY + HYPOTHESIS
Never: Give up
```

### Date-Aware Query Construction
Always embed current year in search queries to avoid stale results.

**Pattern:**
```
WRONG: "How does Express handle middleware?"
RIGHT: "Express middleware pattern 2025"
```

This prevents 2024 documentation from shadowing current best practices.

### Variation in grep_app Queries
Each grep_app call targets a different code pattern angle. This increases coverage across diverse repos.

**Pattern:**
```
Query 1: Direct function call: useQuery(
Query 2: Configuration object: queryOptions
Query 3: Hook parameter: staleTime:
Query 4: Return type: UseQueryResult
```

Each captures different usage patterns from different developers.

## Adaptation Strategy

### What to Keep
- **Request classification system** - This is the secret sauce. It determines tool strategy.
- **Mandatory parallelization** - Never execute tools sequentially.
- **GitHub permalink citations** - Evidence must be verifiable and permanent.
- **Phase 0 → Phase 1 → Phase 2 flow** - Classify first, execute second, synthesize third.
- **Failure recovery table** - Have a fallback for each failure mode.
- **Date awareness** - Embed current year in searches to avoid stale info.

### What to Simplify
- **Tool variety**: In simple contexts, you might only need context7 + grep_app (not websearch_exa)
- **Parallel minimum**: For internal codebases, you might reduce from 6+ to 3+
- **Recovery complexity**: In trusted environments, you might skip fallback steps
- **Communication rules**: If you don't need permalinks, simplify the citation format

### Configuration
```typescript
{
  // Request type detection
  classifyRequest: true,
  
  // Parallelization
  parallelMinimum: {
    typeA: 3,
    typeB: 4,
    typeC: 4,
    typeD: 6
  },
  
  // Citation
  requirePermalinks: true,
  permalinkFormat: "github-blob-sha",
  
  // Date awareness
  enforceCurrentYear: true,
  currentYear: 2025,
  
  // Temp directory
  tempDir: "${TMPDIR:-/tmp}",
  cloneDepth: 1,  // --depth 1 for speed
  
  // Tools
  tools: {
    context7: true,
    websearch_exa: true,
    grep_app: true,
    github_cli: true,
    git: true,
    webfetch: false
  }
}
```

## Implementation Checklist

- [ ] **Set up request classification** - Implement decision tree to categorize requests into TYPE A/B/C/D
- [ ] **Enable parallel tool execution** - Ensure tools can run simultaneously (don't await sequentially)
- [ ] **Implement permalink generation** - Extract commit SHA and construct GitHub URLs with line ranges
- [ ] **Add date awareness** - Check current year, embed in search queries, filter old results
- [ ] **Create failure fallbacks** - For each tool failure mode, have a backup plan
- [ ] **Add citation format** - Structure every code claim as: Claim → Evidence → Code → Explanation
- [ ] **Test grep_app variation** - Write 3+ different queries for same topic to maximize coverage
- [ ] **Implement temp directory cleanup** - Use OS-appropriate temp directory (${TMPDIR:-/tmp})
- [ ] **Add communication rules** - No tool names in output, no preamble, always cite, be concise
- [ ] **Create integration test** - Test with real library (e.g., React) across all four request types

# Log
- 2025-12-16: Created comprehensive Librarian agent implementation guide
- 2025-12-16: Documented request classification system (TYPE A/B/C/D)
- 2025-12-16: Analyzed parallel execution requirements and patterns
- 2025-12-16: Included permalink construction and citation format
- 2025-12-16: Added failure recovery and date awareness patterns
