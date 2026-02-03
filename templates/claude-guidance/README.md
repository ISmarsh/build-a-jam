# Claude Guidance Templates

Ready-to-use AI guidance files for development projects.

## Files

- **CLAUDE.md** — Universal guidance for Claude Code and similar AI assistants
- **copilot-instructions.md** — Review instructions for GitHub Copilot

## Usage

### As a Git Submodule

```bash
# Add to your project
git submodule add https://github.com/YOUR_ORG/claude-guidance .claude-guidance

# In your project's CLAUDE.md, reference the generic guidance:
```

```markdown
# My Project — Claude Context

See [.claude-guidance/CLAUDE.md](.claude-guidance/CLAUDE.md) for universal
development practices (git workflow, PR reviews, code principles).

## Project-Specific Context

[Your project-specific guidance here]
```

### Direct Copy

Copy the files to your project and customize as needed.

## What's Included

### CLAUDE.md

- **Git Practices** — Commit format, branching strategy, PR guidelines
- **PR Review Workflow** — GitHub CLI commands (REST + GraphQL), thread resolution
- **Code Change Principles** — Do/don't lists, security checklist
- **Communication Style** — Direct, technical, honest feedback
- **PR Wrap-up Checklist** — Code duplication, obsolete code, documentation review
- **Development Anti-patterns** — Over-engineering, premature optimization
- **Questions to Ask Pattern** — Clarify before implementing
- **Tool Setup Notes** — GitHub CLI configuration, PATH setup

### copilot-instructions.md

- **What to Flag** — Bugs, security vulnerabilities, accessibility issues, correctness errors
- **What NOT to Flag** — Premature optimization, over-engineering, style nitpicks, intentional patterns
- **Core Philosophy** — Focus on substantive issues over subjective preferences
