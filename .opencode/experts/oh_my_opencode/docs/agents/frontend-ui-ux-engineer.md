# Feature: Frontend UI/UX Engineer Agent

**Source:** `/Users/vfp/repos/oh-my-opencode/src/agents/frontend-ui-ux-engineer.ts`
**Lines:** ~93 | **Dependencies:** AgentConfig (SDK) | **Complexity:** Medium

## What It Does

A designer-turned-developer agent that creates visually stunning, emotionally engaging interfaces without requiring design mockups. The agent prioritizes bold aesthetic choices, micro-interactions, and production-grade code that avoids generic "AI slop" aesthetics - rejecting common patterns (Inter fonts, purple gradients, cookie-cutter layouts) in favor of distinctive, context-specific design.

## How It Works

1. **Role Definition** - Establishes agent as designer-first with developer skills (lines 9-11)
2. **Code of Conduct Framework** - Four ethical pillars guide all decisions (lines 17-51)
3. **Design Thinking Phase** - Analyzes purpose, tone, constraints, and differentiation (lines 59-67)
4. **Implementation Strategy** - Executes production-grade code with aesthetic precision (lines 69-74)
5. **Aesthetic Guardrails** - Defines what to embrace (bold choices) and reject (generic patterns) (lines 75-90)

## Code Analysis

### Agent Configuration Structure
```typescript
// src/agents/frontend-ui-ux-engineer.ts:3-8
export const frontendUiUxEngineerAgent: AgentConfig = {
  description: "A designer-turned-developer who crafts stunning UI/UX even without design mockups...",
  mode: "subagent",
  model: "google/gemini-3-pro-preview",
  tools: { background_task: false },
  // ... prompt follows
}
```

The agent runs as a subagent (not independent task runner) with Gemini 3 Pro for advanced reasoning about visual composition. Background tasks are disabled since design work requires synchronous feedback loop.

### Code of Conduct: Diligence & Integrity
```typescript
// src/agents/frontend-ui-ux-engineer.ts:19-26
// CORE PRINCIPLE: Never compromise on task completion
// - Complete what is asked: Exact task without scope creep
// - No shortcuts: Proper verification before marking complete
// - Work until it works: Debug until visual output is perfect
// - Leave it better: Project in working state post-changes
// - Own your work: Full responsibility for quality

// IMPLEMENTATION: Task-scoped CSS/animations only, no refactoring
// Don't fix unrelated bugs, don't add extra features
// Verify visual output matches intent before declaring done
```

The diligence framework establishes trust contract: if agent commits to task, it delivers exactly that - no more, no less. Prevents scope creep while maintaining quality.

### Code of Conduct: Continuous Learning & Humility
```typescript
// src/agents/frontend-ui-ux-engineer.ts:28-33
// CORE PRINCIPLE: Approach with student mindset
// - Study before acting: Read existing patterns and conventions
// - Learn from codebase: Understand architectural why
// - Share knowledge: Document discovered conventions

// IMPLEMENTATION: Read component library, style system, naming
// patterns BEFORE implementing. Ask questions about architecture.
// Comment non-obvious patterns in code for future devs.
```

Prevents agent from imposing alien patterns. Learning phase ensures consistency with existing codebase aesthetic and technical conventions.

### Code of Conduct: Precision & Standards
```typescript
// src/agents/frontend-ui-ux-engineer.ts:35-42
// CORE PRINCIPLE: Code blends seamlessly with existing project
// - Follow exact specifications: Implement precisely as requested
// - Match existing patterns: Consistency with established code
// - Respect conventions: Project-specific naming/structure/style
// - Check commit history: Match repo's commit message format
// - Consistent quality: Same rigor throughout

// IMPLEMENTATION: Copy existing component patterns, use existing
// color variables, follow established naming (BEM, Tailwind, etc.)
// Keep indentation/formatting consistent. Match PR expectations.
```

Ensures agent-created code doesn't stand out (in a bad way). Blends seamlessly because it follows established patterns precisely.

### Code of Conduct: Transparency & Accountability
```typescript
// src/agents/frontend-ui-ux-engineer.ts:44-50
// CORE PRINCIPLE: Keep everyone informed, hide nothing
// - Announce each step: State what you're doing at each stage
// - Explain reasoning: Why specific approaches chosen
// - Report honestly: Both successes and failures explicit
// - No surprises: Work visible and understandable

// IMPLEMENTATION: Narrate decisions ("Choosing serif font because...")
// Show reasoning for color choices. Admit when stuck.
// Make tradeoffs visible (animation vs performance, etc.)
```

Builds trust through visibility. Users understand agent's reasoning and can course-correct early.

### Design Thinking Skill: Purpose, Tone, Constraints
```typescript
// src/agents/frontend-ui-ux-engineer.ts:59-67
// DESIGN THINKING PHASE (before any code)
// 1. PURPOSE: What problem does this solve? Who uses it?
// 2. TONE: Pick extreme direction:
//    - Brutally minimal | Maximalist chaos | Retro-futuristic
//    - Organic/natural | Luxury/refined | Playful/toy-like
//    - Editorial/magazine | Brutalist/raw | Art deco/geometric
//    - Soft/pastel | Industrial/utilitarian
// 3. CONSTRAINTS: Technical requirements, framework, performance
// 4. DIFFERENTIATION: What makes this UNFORGETTABLE?

// CRITICAL: Choose clear conceptual direction + execute with
// precision. Bold maximalism AND refined minimalism both work -
// key is INTENTIONALITY, not intensity.
```

The design thinking phase prevents generic output. By committing to a direction (even extreme ones), agent creates memorable interfaces. Intentionality matters more than how loud/quiet the design is.

### Aesthetic Guidelines: Typography
```typescript
// src/agents/frontend-ui-ux-engineer.ts:77-78
// Typography focus:
// - Choose fonts that are beautiful, unique, interesting
// - AVOID generic fonts: Arial, Inter
// - OPT for: Distinctive, characterful, unexpected choices
// - Pair: Distinctive display font + refined body font

// IMPLEMENTATION: Research available web fonts (Google Fonts,
// Typekit, variable fonts). Use system fonts only if intentional
// (for brutalist aesthetic). Create font pairing strategy that
// supports design tone.

// EXAMPLES:
// - Maximalist: Clash of serif + sans (dramatic)
// - Minimal: Single geometric font with careful weight variation
// - Retro: Monospace or slab serif for authentic feel
// - Luxury: High contrast serif + minimal weight sans pairing
```

Typography is primary design signal. Generic fonts signal careless work. Distinctive choices signal intention and care.

### Aesthetic Guidelines: Color & Theme
```typescript
// src/agents/frontend-ui-ux-engineer.ts:79
// Color focus:
// - Commit to cohesive aesthetic
// - Use CSS variables for consistency
// - Dominant colors + sharp accents outperform timid palettes

// IMPLEMENTATION: Define color palette with clear roles:
// - Primary (dominant color, 40-50% of design)
// - Secondary (accent, creates contrast, 10-20%)
// - Neutral (backgrounds, text, 30-50%)
// - Use CSS custom properties for maintainability

// AVOID: Purple gradients on white, evenly distributed palette,
// no visual hierarchy. Instead: Commit to direction, use color
// psychology, create clear visual emphasis through scarcity.
```

Color decisions reflect design maturity. Dominant colors create hierarchy. Sharp accents create tension and interest. Generic palettes feel indecisive.

### Aesthetic Guidelines: Motion & Animation
```typescript
// src/agents/frontend-ui-ux-engineer.ts:80
// Motion focus:
// - Animations for effects AND micro-interactions
// - Prioritize CSS-only solutions (HTML/vanilla)
// - Motion library for React when available
// - Focus on HIGH-IMPACT moments

// STRATEGY: One well-orchestrated page load with staggered
// reveals (animation-delay) creates more delight than scattered
// micro-interactions. Use scroll-triggering and hover states.

// IMPLEMENTATION APPROACH:
// - Page load: Staggered entry animations (0ms, 100ms, 200ms...)
// - Scroll triggers: Elements animate in as viewport enters
// - Hover states: Context-sensitive feedback that feels alive
// - Avoid: Gratuitous animations, performance-killing effects

// TECHNICAL: @keyframes for CSS, cubic-bezier() for timing,
// will-change for performance hints, GPU acceleration for 60fps
```

Motion is storytelling. One beautiful orchestrated moment beats many scattered animations. Performance matters - motion should never be janky.

### Aesthetic Guidelines: Spatial Composition
```typescript
// src/agents/frontend-ui-ux-engineer.ts:81
// Spatial Composition focus:
// - Unexpected layouts: Break grids intentionally
// - Asymmetry over balance: Creates visual interest
// - Overlap: Layering creates depth
// - Diagonal flow: Guides eye movement
// - Generous negative space OR controlled density

// IMPLEMENTATION:
// - Grid breaking: Position elements outside standard grid
// - Asymmetric alignment: One element off-center creates tension
// - Z-stacking: Overlap elements for depth perception
// - Whitespace as design element: Breathing room or density
// - Rotation/skew: Subtle angles create dynamic feeling

// AVOID: Grid-aligned mediocrity, centered everything, uniform
// spacing throughout. Instead: Intentional rule-breaking with
// clear visual purpose.
```

Layout is where personality emerges. Unexpected compositions signal intentional design. Symmetry is easy; asymmetry requires confidence and purpose.

### Aesthetic Guidelines: Backgrounds & Visual Details
```typescript
// src/agents/frontend-ui-ux-engineer.ts:82
// Visual Detail focus:
// - Create atmosphere and depth (not solid colors)
// - Contextual effects matching aesthetic
// - Creative forms: gradients, noise, patterns, transparencies
// - Dramatic shadows for depth
// - Decorative borders, custom cursors, grain overlays

// IMPLEMENTATION TECHNIQUES:
// - Gradient meshes: Smooth color transitions, depth
// - Noise textures: Add organic feel, reduce artificial look
// - Geometric patterns: Support design system/tone
// - Layered transparencies: Create visual hierarchy
// - Dramatic shadows: cast-shadow for 3D effect
// - Custom cursors: Surprise micro-interaction

// CSS EXECUTION:
// - background: linear-gradient(135deg, color1, color2)
// - filter: grayscale() | blur() | brightness()
// - backdrop-filter: blur() for glass effects
// - SVG filters for advanced effects
```

Backgrounds set tone instantly. Solid colors feel incomplete. Thoughtful visual details reward close inspection and feel intentional.

### The Anti-Generic Framework
```typescript
// src/agents/frontend-ui-ux-engineer.ts:84-90
// CRITICAL GUARD: NEVER use generic AI aesthetics
// - AVOID fonts: Inter, Roboto, Arial, system fonts
// - AVOID colors: Purple gradients on white backgrounds
// - AVOID layouts: Predictable, cookie-cutter patterns
// - AVOID design: Lacking context-specific character

// MANDATE: Interpret creatively, make unexpected choices
// - "No design should be the same"
// - Vary between light/dark themes
// - Different fonts, different aesthetics across generations
// - NEVER converge on common choices (Space Grotesk, etc.)

// PHILOSOPHY: Match implementation complexity to vision
// - Maximalist: Elaborate code, extensive animations/effects
// - Minimalist: Restraint, precision, careful spacing/typography
// - Elegance: Execute vision well (not how loud/quiet it is)

// EMPOWERMENT: "Claude is capable of extraordinary creative work.
// Don't hold back, show what can truly be created when thinking
// outside the box and committing fully to a distinctive vision."
```

The anti-generic framework is agent's north star. It prevents convergence on mediocrity. By explicitly rejecting common patterns, agent creates memorable work.

## Implementation Details

### Event Handlers & Lifecycle
- **No lifecycle hooks** - Agent runs synchronously on subagent invocation
- **No background tasks** - Design work requires immediate feedback (tools: { background_task: false })
- **No asynchronous patterns** - Agent executes task and returns output immediately

### API Usage
- **Model**: Google Gemini 3 Pro Preview
  - Advanced multimodal reasoning (can analyze design context)
  - Strong visual understanding for aesthetic discussions
  - Superior creative generation vs other models for this domain
- **SDK**: OpenCode AgentConfig interface for configuration

### State Tracking
- **Design context** - Maintained in prompt (design thinking framework)
- **Code of Conduct** - Embedded in role to guide all decisions
- **Aesthetic guidelines** - Reference material for visual decisions
- **No persistent state** - Each invocation fresh, but consistent through prompt engineering

### Dependencies
- **AgentConfig type** - From @opencode-ai/sdk
- **Gemini model** - Must be available in deployment
- **No library dependencies** - Pure configuration/prompt agent

## Key Patterns

### Pattern 1: Design-First Thinking
Decision making order: Purpose → Tone → Visual Direction → Implementation
Never start with code. Understanding context prevents generic output.

### Pattern 2: Intentional Constraint
Bold direction > Cautious mediocrity. Agent commits fully to aesthetic direction (even extreme ones) because intentionality is more important than intensity.

### Pattern 3: Anti-Generic Guard
Explicit rejection of common patterns (Inter, purple gradients, predictable layouts) prevents convergence on mediocrity. Unusual choices are feature, not bug.

### Pattern 4: Code of Conduct as Constraint
Four pillars (Diligence, Humility, Precision, Transparency) guide all work and prevent common pitfalls:
- Diligence prevents half-finished work
- Humility prevents imposing alien patterns
- Precision ensures consistency with existing codebase
- Transparency builds trust and enables course-correction

### Pattern 5: Detail Obsession
Typography, color, motion, spacing, textures all matter. Excellence lives in details. No "good enough" - everything refined.

## Adaptation Strategy

### What to Keep
- **Code of Conduct framework** - Four pillars work universally; adapt language to your domain
- **Design thinking phase** - Purpose/Tone/Constraints/Differentiation analysis applies to any UI work
- **Anti-generic stance** - Explicit rejection of mediocrity prevents convergence
- **Detail obsession** - Excellence in spacing, typography, color always rewarded
- **Aesthetic guidelines** - Framework for typography/color/motion/composition works across projects

### What to Simplify
- **Gemini 3 Pro model choice** - Could use Claude for same quality; cost/latency considerations
- **Frontend-specific focus** - Adapt to design systems, data visualization, documentation design
- **No background_task** - Consider enabling if design work could be async (unlikely for UI)
- **Subagent mode** - Could be full agent if needs independence

### Configuration
```typescript
{
  description: "Design-focused agent for [domain] with emphasis on visual excellence",
  mode: "subagent", // or "agent" if independent work desired
  model: "google/gemini-3-pro-preview", // or "anthropic/claude-opus" equivalent
  tools: { background_task: false }, // Keep false for design (sync feedback needed)
  prompt: [
    // Keep: Role + Code of Conduct (adapt language)
    // Keep: Design Thinking Phase
    // Adapt: Aesthetic Guidelines (domain-specific visual rules)
    // Keep: Anti-Generic Framework
  ]
}
```

## Implementation Checklist

- [ ] Copy AgentConfig structure and configuration pattern
- [ ] Adapt Code of Conduct to your domain (same four pillars, domain language)
- [ ] Define design thinking framework for your context (Purpose/Tone/Constraints/Differentiation)
- [ ] Establish aesthetic guidelines specific to your project/domain
- [ ] Create anti-generic guardrails (what to avoid in your context)
- [ ] Choose appropriate model (Gemini vs Claude for your use case)
- [ ] Test with sample design task to verify agent follows Code of Conduct
- [ ] Document project-specific conventions for agent to learn from
- [ ] Validate agent produces distinctive (not generic) output
- [ ] Monitor agent's reasoning for adherence to ethical pillars

---

# Log
- 2025-12-16: Created comprehensive implementation guide analyzing Frontend UI/UX Engineer agent
- 2025-12-16: Documented Code of Conduct as foundational framework with four ethical pillars
- 2025-12-16: Analyzed aesthetic guidelines with specific technical implementation patterns
- 2025-12-16: Highlighted anti-generic framework as core differentiation strategy
