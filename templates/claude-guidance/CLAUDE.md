# Claude Code Guidance

Universal guidance for AI-assisted development. This file provides ready-to-use
patterns that work across projects. Import or reference from your project-specific
CLAUDE.md.

## Git Practices

### Commits

- Atomic commits: one logical change per commit
- Message format: imperative mood, explain *why* not just *what*
- Include `Co-Authored-By: Claude <noreply@anthropic.com>` for AI-assisted commits

### Branches

- Keep feature branches short-lived
- Rebase on main before merging to reduce noise
- Delete branches after merge

### Pull Requests

- Keep PRs focused on a single concern
- Prefer merge commits over squash (preserves granular history)
- Never force-push to shared branches

## PR Review Workflow (GitHub CLI)

### Fetching unresolved review threads

The REST API (`/pulls/{pr}/comments`) returns all comments with no resolved filter.
Use GraphQL instead:

```bash
gh api graphql -f query='query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes { body path line databaseId }
          }
        }
      }
    }
  }
}'
```

Filter results for `isResolved: false`.

### Replying to comments

```bash
gh api repos/OWNER/REPO/pulls/PR/comments/COMMENT_ID/replies -f body="Reply text"
```

**Escaping pitfalls:**
- Avoid backticks in reply text — the shell interprets them
- Use `databaseId` from GraphQL (numeric) for the REST reply endpoint
- Double quotes and `$` also cause issues; use single quotes or escape

### Resolving threads (batched)

```bash
gh api graphql -f query='mutation {
  t1: resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } }
  t2: resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } }
}'
```

### Typical review workflow

1. Fetch unresolved threads (GraphQL)
2. Triage: fix actionable items, note dismissals
3. Make code changes
4. Reply to each comment (explain fix or dismissal reason)
5. Resolve all threads via batched mutation
6. Commit and push

## Code Change Principles

### Do

- Read existing code before suggesting modifications
- Match existing patterns in the codebase
- Keep solutions simple and focused
- Fix only what was asked — avoid scope creep
- Consider security implications (XSS, injection, auth)
- Maintain accessibility (WCAG 2.1 AA)

### Do Not

- Add features beyond what was requested
- Refactor surrounding code while fixing a bug
- Add abstractions for patterns that appear fewer than 3 times
- Add error handling for scenarios that can't happen
- Create helpers or utilities for one-time operations
- Add comments explaining obvious code
- Add type annotations to code you didn't change
- Suggest performance optimizations without measured need
- Add backwards-compatibility shims — just change the code
- Leave `// removed` comments or rename unused variables to `_var`

### Security Checklist

Before completing any change, verify:
- [ ] No user input rendered as raw HTML (XSS)
- [ ] No string concatenation in SQL/commands (injection)
- [ ] No secrets in code or logs
- [ ] No overly permissive CORS or auth
- [ ] Dependencies are from trusted sources

## Communication Style

- Be direct and technical
- Explain design decisions when non-obvious
- Acknowledge trade-offs honestly
- Don't over-praise or validate unnecessarily
- Disagree when warranted — correctness over agreement

## PR Wrap-up Checklist

Before merging a pull request, consider these checks:

### Automated Checks
- Build, lint, and tests (typically handled by CI)
- Security scanning and accessibility audits (if configured)

### Manual Checks

**1. Code duplication check**
- Scan for duplicated logic across files
- Extract when a pattern appears **3+ times** AND reduces actual code
- Don't over-abstract for 2 instances
- Good: consolidating duplicate message strings
- Bad: a helper that just wraps a standard library call with no reduction

**2. Obsolete code check**
- Look for unused imports
- Dead functions or unreachable code
- Stale comments referencing removed features
- Old commented-out code blocks

**3. Documentation review**
- Verify README matches current implementation
- Check that code examples still work
- Update architecture docs if structure changed
- Confirm file listings are accurate

**4. Review comment triage** (if using automated reviewers)
- Categorize comments: fix, dismiss, or already-addressed
- Reply to each comment explaining the action taken
- Resolve threads after addressing
- Present dismissals for approval before resolving

## Development Anti-patterns to Avoid

- Don't add complex abstractions too early
- Don't over-engineer — keep solutions simple
- Don't add dependencies without justification
- Don't sacrifice clarity for brevity
- Don't create utilities for one-time operations
- Don't optimize prematurely without measurements
- Don't refactor unrelated code during bug fixes
- Don't add features beyond what was requested

## Questions to Ask Pattern

When users request features, clarify approach before implementing:

- "Would you like me to explain the concept first, or dive straight into code?"
- "Are there any constraints I should be aware of (performance, compatibility, etc.)?"
- "Should this integrate with existing patterns, or establish a new approach?"
- "Do you prefer a minimal implementation first, or a more complete solution?"

Prefer asking questions over making assumptions. Better to clarify than redo work.

## Tool Setup Notes

### GitHub CLI (`gh`)

The `gh` CLI should be available in PATH for PR management, review workflows,
and GraphQL API access. If running in an environment with limited PATH
(like some CLI tools), configure hooks to extend PATH on startup.

**Example:** Adding tools via session start hook:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  # Add CLI tools not found in default PATH
  if [ -d "/custom/path/to/tool" ]; then
    echo 'export PATH="$PATH:/custom/path/to/tool"' >> "$CLAUDE_ENV_FILE"
  fi
fi
exit 0
```

Tools added to `CLAUDE_ENV_FILE` persist for the entire session.
