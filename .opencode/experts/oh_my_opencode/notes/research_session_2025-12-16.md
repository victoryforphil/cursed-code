# Research Session: 2025-12-16

## Objective
Understand oh-my-opencode architecture to identify features for cursed-code à la carte approach.

## Repository
- **URL:** https://github.com/code-yeongyu/oh-my-opencode
- **Cloned to:** `~/repos/oh-my-opencode`
- **Version:** 2.1.3
- **Branch:** master
- **Commit:** a2d2109

## Methodology
1. Cloned repository to ~/repos
2. Analyzed README.md for feature overview
3. Examined src/index.ts for plugin architecture
4. Read hooks/index.ts for hook catalog
5. Studied key hooks: todo-continuation-enforcer, keyword-detector, comment-checker
6. Analyzed background-agent manager
7. Reviewed config schema (Zod)

## Key Findings

### Architecture
- Monolithic plugin (~567 line main entry point)
- 21 hooks, 7 agents, 11 LSP tools, 3 MCP servers
- Config-driven feature toggles
- Two-tier config system (user + project)
- Zod validation throughout

### Standout Features
1. **Background Task Manager** - Parallel agent execution (killer feature)
2. **Todo Continuation Enforcer** - Prevents mid-task abandonment
3. **Keyword Detector** - Auto-mode switching (ultrawork, ultrathink)
4. **Rules Injector** - Conditional rules via glob matching
5. **Directory Context Injector** - Hierarchical AGENTS.md collection

### Code Quality
- No tests
- Tight coupling between hooks
- Author admits: "I don't really know TypeScript"
- But: Comprehensive features, active development, good documentation

### Philosophy Mismatch
- oh-my-opencode = oh-my-zsh (monolithic bundle)
- cursed-code = shadcn/neovim (à la carte)

## Extraction Strategy

### High Priority (Create First)
1. `@cursed/todo-enforcer` (~250 lines, zero deps)
2. `@cursed/keyword-detector` (~150 lines, minimal deps)
3. `@cursed/directory-context` (~400 lines, zero deps)
4. `@cursed/background-tasks` (~800 lines, complex but high-value)
5. `@cursed/rules-engine` (~600 lines, medium complexity)

### Medium Priority
6. `@cursed/context-monitor` (~200 lines)
7. `@cursed/tool-truncator` (~300 lines)
8. `@cursed/comment-checker` (~200 lines, npm dep)
9. `@cursed/think-mode` (~150 lines)

### Low Priority
10. Session recovery, agent reminders, notifications, etc.

## Patterns to Adopt

### ✅ Good Patterns
- Hook creation: `createXXXHook(ctx) → { event, ... }`
- Zod schemas for config validation
- Two-tier config (user + project)
- Lazy resource loading
- Tool directory structure

### ❌ Avoid
- Monolithic bundling
- Tight hook coupling
- Zero tests
- Opinionated model defaults

## Implementation Notes

For cursed-code:
- Each hook → separate npm package
- Use Zod for config validation
- Document patterns in meta expert
- Test critical plugins
- Fork-friendly (not config toggles)

## Open Questions
1. Monorepo vs separate repos for cursed plugins?
2. Naming convention: `@cursed/*` or `opencode-*`?
3. Which plugin to implement first? (Recommendation: todo-enforcer)
4. Should we create a plugin template/scaffold?

## Next Steps (If Proceeding)
1. Create plugin template in script_maker
2. Document hook pattern in meta/wiki
3. Implement `@cursed/todo-enforcer` as proof of concept
4. Establish testing patterns
5. Create cursed-plugins org on GitHub

## Resources Created
- `.opencode/experts/oh_my_opencode/PROMPT.md`
- `.opencode/experts/oh_my_opencode/wiki/architecture.wiki.md`
- `.opencode/experts/oh_my_opencode/wiki/features.wiki.md`
- `.opencode/experts/oh_my_opencode/wiki/lessons.wiki.md`
- This notes file

## Conclusion
oh-my-opencode provides excellent reference implementation for OpenCode plugins, but its monolithic approach contradicts cursed-code philosophy. Key features can be extracted into standalone plugins. Background task manager is the killer feature worth the complexity.

# Log
- 2025-12-16 02:30: Research session completed, expert created
