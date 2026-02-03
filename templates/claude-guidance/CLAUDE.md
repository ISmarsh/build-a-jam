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
