---
description: Review a prompt for quality and effectiveness
arguments:
  - name: path
    description: Path to prompt file
    required: true
---

Review the prompt at $ARGUMENTS.path using the prompt_pro agent.

Provide:
- Overall score (1-10)
- Strengths identified
- Issues with severity levels and fixes
- Actionable recommendations

If issues are found, offer to rewrite the prompt with improvements.
