# Scraping Guide

How to run, maintain, and extend the exercise data scrapers.

## Quick Reference

### Running scrapers

```bash
# Run all active scrapers + post-processing
npm run scrape

# Run a single scraper
node scripts/scrape-learnimprov.mjs
node scripts/scrape-improwiki.mjs
```

### Command-line flags

| Flag | Scraper | Effect |
|------|---------|--------|
| `--force` | learnimprov, improwiki | Bypass HTML cache, re-fetch from network |
| `--clear-cache` | learnimprov | Delete progress cache before running |

### Pipeline

`scrape-all.mjs` runs these steps in order:

1. `scrape-learnimprov.mjs` — fetch from learnimprov.com (CC BY-SA 4.0)
2. `scrape-improwiki.mjs` — fetch from improwiki.com (CC BY-SA 3.0 DE)
3. `normalize-tags.mjs` — deduplicate, filter low-use tags, remove blacklisted tags
4. `cleanup-scraped-data.mjs` — extract clean HTML from raw, filter non-exercises, report missing summaries

Summaries are generated on-demand by Claude, not by a script.

### Post-processing scripts (standalone)

```bash
node scripts/normalize-tags.mjs        # Re-normalize tags from rawTags
node scripts/cleanup-scraped-data.mjs   # Re-clean descriptions
```

---

## Architecture

### Data flow

```
Source site
  → fetchPage() with retry + HTML cache (.scrape-cache/)
  → Parse HTML with cheerio
  → Extract: id, name, description_raw, tags, sourceUrl
  → Write to src/data/{source}-exercises.json

Post-processing:
  → normalize-tags.mjs (clean tags from rawTags field)
  → cleanup-scraped-data.mjs (extract clean description from description_raw)
```

### Shared utilities (`scraper-utils.mjs`)

All scrapers use these shared functions:

| Export | Purpose |
|--------|---------|
| `fetchPage(url, retries, headers, cacheFile, forceRefetch)` | HTTP fetch with retry, exponential backoff, HTML caching |
| `sleep(ms)` | Rate limiting between requests |
| `loadCache(filename)` / `saveCache(filename, map)` | Progress cache for resume on crash |
| `clearCache(filename)` | Delete progress cache |
| `loadExistingData(path)` | Load existing JSON for incremental mode |
| `sanitizeTags(tags)` | Remove whitespace, deduplicate |
| `deriveTagsFromContent(text, keywords)` | Tag extraction from description text |
| `standardTagKeywords` | Shared tag keyword definitions |

### HTML caching

Raw HTTP responses are cached in `.scrape-cache/` (gitignored). This avoids
re-hitting source sites when iterating on parsing logic. Use `--force` to
bypass the cache and re-fetch from the network.

### Resume capability

Scrapers save progress to `.scrape-cache/{source}-progress.json` every 10
exercises. If a scrape is interrupted, re-running picks up where it left off.
Use `--clear-cache` to force a fresh start.

### Feature flags (learnimprov only)

```javascript
const ENABLE_PAGINATION = true;  // Follow "Next Page" links on category indexes
const ENABLE_SITEMAP = true;     // Check sitemap.xml for additional exercise URLs
```

These supplement the primary WordPress REST API approach. Pagination and sitemap
URLs are merged with API results and deduplicated.

---

## How each scraper works

### learnimprov.com

**Index method**: WordPress REST API (`/wp-json/wp/v2/posts?categories={id}`)

1. Fetches WordPress category and tag ID→name mappings via API
2. For each category (`warm-up`, `exercise`), fetches all posts via paginated API
3. For each post, fetches the full HTML page for `description_raw`
4. Optionally checks sitemap.xml and pagination for coverage gaps
5. Deduplicates exercises that appear in multiple categories (merges tags)

**Categories scraped**: `warm-up`, `exercise`
**Deliberately excluded**: handles, long-forms, ask-fors (different content types)

**Rate limiting**: 1 second between page fetches, 500ms between API calls

### improwiki.com

**Index method**: HTML index pages

1. Fetches index pages (`/en/improv-exercises`, `/en/improv-games`, etc.)
2. Extracts exercise links from the HTML
3. For each link, fetches the full page for `description_raw`
4. Filters out non-exercise content (groups, theaters, glossary entries)

**Rate limiting**: 500ms between fetches

---

## Adding a New Source

### 1. Pre-check

Before writing any code:

- [ ] **License**: Must be CC-licensed, public domain, or explicitly open
- [ ] **robots.txt**: Check and respect disallowed paths
- [ ] **Data quality**: Exercises should have descriptions, not just titles
- [ ] **Overlap**: Check for duplicates with existing sources

### 2. Investigate index URLs

Try in order of preference:

| Method | How to test | Reliability |
|--------|-------------|-------------|
| WordPress REST API | `curl -sI https://site.com/wp-json/wp/v2/posts` | Best — structured JSON, pagination |
| Sitemap | `curl -s https://site.com/sitemap.xml` | Good — comprehensive coverage |
| RSS/Atom feed | `curl -s https://site.com/feed/` | Limited — usually only recent posts |
| HTML scraping | Manual inspection | Fragile — breaks on redesign |

### 3. Create the scraper

Copy the closest existing scraper as a starting point. Every scraper must have:

- **Rate limiting**: 500ms+ between requests (`sleep(FETCH_DELAY_MS)`)
- **Retry logic**: Use `fetchPage()` from scraper-utils (retries 3x with backoff)
- **Resume capability**: `loadCache`/`saveCache` every 10 exercises
- **Respectful headers**: Use `fetchPage()` which sets browser-like User-Agent
- **Attribution metadata**: Include source, license, licenseUrl, scrapedAt

### 4. Register it

Add to `scrape-all.mjs`:

```javascript
const SCRAPER_SCRIPTS = [
  // ... existing scrapers
  { file: "scrape-newsource.mjs", label: "newsource.com" },
];
```

Add to `cleanup-scraped-data.mjs` DATA_FILES array.

### 5. Document

- Add license details to `LICENSE-DATA`
- Add source entry to the Scraped Data section of `CLAUDE.md`

---

## Disabled sources

These scrapers exist but are commented out in `scrape-all.mjs`:

| Script | Source | Why disabled |
|--------|--------|-------------|
| `scrape-improvencyclopedia.mjs` | improvencyclopedia.org | "Free for non-commercial use" — not an open license |
| `import-improvdb.mjs` | ImprovDB (GitHub) | No LICENSE file in repo |

Contact the respective site owners before enabling.

---

## Error handling

- **Network errors**: `fetchPage()` retries 3 times with exponential backoff
- **404 errors**: Exercise skipped, scraping continues
- **Cache errors**: Warning logged, scraper continues without cache
- **Sitemap errors**: Warning logged, falls back to API/HTML scraping

---

## Anti-patterns

- Scraping without checking robots.txt or license
- No rate limiting (hammering servers)
- No caching (re-fetching everything on every run)
- Missing attribution metadata
- Hardcoding pagination page numbers instead of detecting them
