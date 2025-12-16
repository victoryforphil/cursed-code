---
description: Apply consistent style to a prompt
arguments:
  - name: path
    description: Path to prompt file
    required: true
  - name: style
    description: Style to apply (minimal, friendly, technical, agentic)
    required: false
---

Apply the ${ARGUMENTS.style:-agentic} style to the prompt at $ARGUMENTS.path using the prompt_pro agent.

Ensure:
- Consistent terminology throughout
- Single voice maintained
- Appropriate formatting rules
- Style-specific patterns applied

Output styled version with changes highlighted.
