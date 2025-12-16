# cursed-code

OpenCode dotfiles for reusable agents, tools, prompts, and experts.

## Agents vs Experts

- **Agents** (`.opencode/agent/*.md`) - Define behavior, prompts, tools, permissions
- **Experts** (`.opencode/experts/*/`) - Accumulate knowledge over time (docs, fixes, wikis, flows)

Agents may reference an expert's PROMPT.md for domain context.

## Expert Structure

```
.opencode/experts/{name}/
├── PROMPT.md        # Entry point, agent context
├── todo/*.todo.md   # Task tracking
├── wiki/*.wiki.md   # Distilled knowledge
├── fix/*.fix.md     # Problem/solution logs
├── docs/            # Raw reference material
├── flows/           # Step-by-step workflows
└── scripts/         # Helper scripts
```

## Conventions

- Keep files short, no fluff
- Add `# Log` at end of files for evolution tracking
- New ideas? Add to root TODO.md under "Ideas" section for review
- It's okay to disagree when asked about designs - be a peer
- When subagents return results, always relay them to the user
- Git commits: always show hash and message to user after committing

## Available Agents

- **scout** - Research via MCPs, download docs, take notes, auto-create expert folders
- **wikify** - Distill raw docs to condensed wiki format
- **git** - Commit with repo-specific patterns, learns conventions

## Available Experts

- **scout** - Research strategies and MCP usage patterns
- **meta** - Repository architecture and design decisions
- **git** - Git workflows and commit conventions for this repo
- **prompt_pro** - Prompt engineering patterns and best practices
- **script_maker** - Bun script creation with proper conventions
