# Copilot Code Review Instructions

## Project context

This is a learning project (Angular developer learning React). One active
developer. Prioritize real bugs, correctness issues, and security over code
style polish.

## Styling system

The project uses **Tailwind CSS with CSS custom property theme tokens** defined
in `src/index.css`. Understanding how the styling works is critical for accurate
reviews.

**Theme tokens** (semantic color names):

- `primary`, `secondary`, `destructive`, `muted`, `accent`, `card`, `popover`
- `foreground`, `muted-foreground`, `secondary-foreground`, `card-foreground`
- `border`, `input`, `ring`
- `star` (custom — for favorite/star icons)

**Tailwind opacity modifiers are NOT hardcoded colors.** Classes like
`bg-primary/10`, `border-primary/30`, `text-destructive/80`, and
`hover:text-primary/70` use Tailwind's opacity modifier syntax on theme tokens.
These ARE theme-aware — the `/10` is an opacity modifier on the CSS custom
property, not a separate hardcoded value. Do not flag these as hardcoded colors.

**Hover patterns:**

- Interactive text: `text-primary hover:text-primary-hover` (dedicated hover token)
- Destructive actions: `text-destructive hover:text-destructive/80` (opacity fade)
- Muted → visible: `text-muted-foreground hover:text-foreground`
- These are established project conventions. Inconsistencies within a pattern
  are worth flagging; the patterns themselves are intentional.

**Actual hardcoded colors to flag:** `bg-gray-*`, `text-white`, `text-black`,
`border-red-*`, `bg-blue-*`, or any Tailwind color scale (`slate`, `zinc`,
`red`, `blue`, etc.) used directly instead of a theme token.

## Do flag

- **Actual hardcoded Tailwind color scale values** — e.g. `bg-gray-900`,
  `text-red-500`, `border-slate-300`. These should use theme tokens.
- **Logic bugs** — incorrect calculations, unreachable code, broken validation.
- **Security issues** — XSS, injection, unescaped user input in HTML contexts.
- **Accessibility regressions** — missing aria labels, broken keyboard navigation.

## Do not flag

- **Tailwind opacity modifiers on theme tokens** — `bg-primary/10`,
  `text-destructive/80`, etc. are intentional and theme-aware. See above.
- **`useMemo`/`useCallback` suggestions** — This is a learning project and
  performance optimization hooks are a planned future topic. The data sets
  are small (< 500 exercises). Don't suggest memoization unless there's a
  measurable performance issue.
- **Premature abstractions** — Don't suggest extracting helpers, constants, or
  CSS variables unless a pattern repeats 3+ times. Two similar-but-not-identical
  usages do not warrant a shared abstraction.
- **Intentional Tailwind design tweaks** — Changes to rounding, font weight,
  spacing, or other Tailwind utility classes are intentional design decisions,
  not accidental drift. Don't suggest reverting them or adding documentation.
- **Label formatting** — Colons in `<label>` elements are a stylistic choice,
  not an accessibility issue. Don't flag them.
- **Over-engineering for hypothetical future changes** — Don't suggest CSS
  variables for one-off padding values, moving inputs into unrelated components
  for "cohesion", or other restructuring that solves problems that don't exist
  yet.
- **Function naming opinions** — Don't suggest renaming functions unless the
  current name is actively misleading. "Could be clearer" is not actionable
  when the name reads correctly in context.
