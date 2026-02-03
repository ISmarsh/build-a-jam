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

- Git commit and branch practices
- PR review workflow with GitHub CLI commands (REST + GraphQL)
- Code change principles (do/don't lists)
- Security checklist
- Communication style guidance

### copilot-instructions.md

- What to flag: bugs, security issues, accessibility problems
- What NOT to flag: premature optimization, over-engineering, style nitpicks
