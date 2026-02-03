# Claude Code AI Guidance Templates

Generic, ready-to-use AI assistant guidance for development projects. Designed to
be extracted as a Git submodule or copied directly into your project.

## Contents

| File | Purpose |
| ---- | ------- |
| `CLAUDE.md` | Universal development guidance (Git, PR workflows, code principles, security) |
| `copilot-instructions.md` | Code review priorities for automated reviewers (what to flag/avoid) |
| `README.md` | Integration instructions and usage guidance |

## Integration Methods

### Option 1: Git Submodule (Recommended)

Create a standalone repo, then reference it from projects:

```bash
# In your project:
git submodule add https://github.com/YOU/claude-guidance .claude-guidance

# Reference from your project-specific CLAUDE.md:
# See .claude-guidance/CLAUDE.md for base guidance
```

### Option 2: Direct Copy

```bash
# Copy files into your project:
cp templates/claude-guidance/CLAUDE.md .
cp templates/claude-guidance/copilot-instructions.md .github/
```

## Usage in Projects

### Composable Guidance

Project-specific files should reference this base guidance and add only
project-specific overrides:

```markdown
# My Project - Claude Context

> See .claude-guidance/CLAUDE.md for universal development guidance.

This document covers project-specific patterns and context.

## Project Purpose
[Your project description...]

## Tech Stack
[Your stack details...]
```

### Extending Copilot Instructions

Reference the base instructions at the top of your project-specific file:

```markdown
# Copilot Instructions

> See ../.claude-guidance/copilot-instructions.md for base review guidance.

## Project-Specific Patterns

- Custom framework patterns
- Domain-specific terminology
- Project coding conventions
```

## Design Principles

1. **Ready to use** — No placeholders. Files work immediately.
2. **Domain-agnostic** — No project-specific content.
3. **Composable** — Projects extend rather than duplicate.
4. **Self-documenting** — Clear instructions and examples included.
