# Git Workflow Conventions

## Push After Commit
Always push to origin after committing. No exceptions.

```bash
git commit -m "message"
git push origin main
```

## Commit Message Format
```
{Subject/Module/System} // {Message} (Optional Tags)
```

Multi-level subjects for nested modules:
- `Experts // Git // Message`
- `Config // Add feature`
- `Docs // Update README`

## Multi-line Context
For complex changes, add summary after first line:
```
Subject // Brief message

- Detail 1
- Detail 2
- Why this change matters
```

# Log
- 2024-12-15: Created, documented push-after-commit rule
