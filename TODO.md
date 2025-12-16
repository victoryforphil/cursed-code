# cursed-code TODO

## Phase 1: Foundation ✓
- [x] Create .opencode directory structure
- [x] Create opencode.json with agent definitions
- [x] Create oh-my-opencode.json with MCP config

## Phase 2: Agents ✓
- [x] scout agent - research via MCPs
- [x] scribe agent - 1-1 markdown converter
- [x] wikify agent - distill to wiki format
- [x] git agent - commit with repo patterns

## Phase 3: Experts ✓
- [x] scout expert - tips on research
- [x] meta expert - lessons about this repo
- [x] git expert - learns repo commit conventions

## Phase 4: Commands ✓
- [x] /research command - invoke scout
- [x] /scribe command - invoke scribe  
- [x] /wikify command - invoke wikify
- [x] /commit command - invoke git

## Phase 5: Future ✓
- [x] prompt_pro expert - prompt engineering patterns
- [x] script_maker expert - creates Bun scripts with shebangs and best practices, invoked when scripts needed
- [x] Fetch OpenCode docs for config schemas

## Phase 6: SWE Workflow ✓
- [x] planner agent - DeepSeek-R1 for task decomposition
- [x] architect agent - Qwen 2.5 for implementation specs
- [x] coder agent - Qwen 2.5 for fast execution
- [x] swe_workflow expert - workflow documentation

## Ideas
<!-- Agents: add ideas here for review -->

### SWE Workflow Enhancements
- [ ] **Orchestrator agent** - Auto-chain planner→architect→coder without manual handoff
- [ ] **Reviewer agent** - Validates coder output before commit (code quality, test coverage)
- [ ] **Spec files** - Architect writes to `.opencode/specs/` for complex multi-file changes
- [ ] **/swe command** - Single command to trigger full pipeline
- [ ] **Memory/learning** - Track which patterns work well per-codebase
- [ ] **Parallel execution** - Run multiple coder instances for independent tasks
- [ ] **Verification hooks** - Auto-run tests after coder completes
- [ ] **Rollback capability** - Undo coder changes if verification fails

### Agent Improvements
- [ ] **Tool use model** - Test llama3-groq-tool-use:8b for simple tasks (faster, smaller)
- [ ] **Model fallback** - Cloud API backup when local models fail
- [ ] **Context optimization** - Summarize/compact context between agent handoffs
- [ ] **Temperature tuning** - Fine-tune per task type (lower for code, higher for planning)

### oh-my-opencode Patterns to Extract
- [ ] **todo-continuation-enforcer** - Prevent agents stopping mid-task
- [ ] **context-window-monitor** - Warn before hitting token limits
- [ ] **tool-output-truncator** - Smart truncation of large outputs
- [ ] **keyword-detector** - Auto-mode switching (ultrawork, ultrathink)
