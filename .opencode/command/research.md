---
description: Research a topic and populate expert knowledge
agent: scout
subtask: true
---

Research "$1" using available MCPs and sources.

**Target expert:** `.opencode/experts/$1/`

**Sources to use:**
- Available MCPs: Context7, Perplexity, grep.app
- Provided URLs (if any): $2 $3 $4 $5
- Use `download-page` tool for URLs to avoid context bloat

**Process:**
1. Research the topic using MCPs
2. Download any provided URLs to `docs/`
3. Take notes on interesting findings in `notes/`
4. Save raw documentation to `docs/`

**After gathering docs, automatically invoke wikify** to distill findings into `wiki/*.wiki.md` files.

Store all findings in the expert folder structure. Create the folder if it doesn't exist.

Report:
- Sources consulted
- Docs downloaded
- Key findings
- Wiki files created
