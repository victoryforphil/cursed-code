# Delegation Rules

## ALWAYS Delegate These Tasks

- **Git commits** → Use git agent (subagent_type="git")
- **Research/documentation** → Use scout agent (subagent_type="scout")
- **Markdown conversion** → Use scribe agent (subagent_type="scribe")
- **Wiki creation** → Use wikify agent (subagent_type="wikify")

Never perform these tasks directly unless the agent fails.

## When User Requests Commits

Even if the user asks casually ("commit this", "commit recent work"), ALWAYS use the git agent. Do not commit directly.

# Log
- 2024-12-16: Created to enforce agent delegation rules
