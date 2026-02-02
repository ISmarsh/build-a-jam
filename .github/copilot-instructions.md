# Copilot Code Review Instructions

## Project context

This is a learning project (Angular developer learning React). One active
developer. Prioritize real bugs, correctness issues, and security over code
style polish.

## Do flag

- **Hardcoded colors that should use theme tokens** — The project uses Tailwind
  CSS theme tokens (`bg-primary`, `text-muted-foreground`, `border-input`, etc.)
  defined in `src/index.css`. Flag instances of hardcoded color values
  (`bg-gray-900`, `text-white`, `hover:bg-red-500`, etc.) that should use the
  corresponding theme token instead.

## Do not flag

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
