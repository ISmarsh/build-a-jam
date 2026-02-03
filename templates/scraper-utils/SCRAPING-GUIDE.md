# Web Scraping Guide

Best practices for respectful, resilient web scraping.

## Before You Scrape

### Legal and Ethical Checks

- [ ] **License**: Content must be CC-licensed, public domain, or explicitly permitted
- [ ] **robots.txt**: Check and respect disallowed paths
- [ ] **Terms of Service**: Review for scraping restrictions
- [ ] **Rate limits**: Plan for respectful request pacing

### Data Quality Assessment

- [ ] Content has sufficient depth (not just titles/links)
- [ ] Data is structured enough to parse reliably
- [ ] Check for overlap with existing sources

## Architecture

### Data Flow

```
Source site
  → fetchPage() with retry + HTML cache
  → Parse HTML (cheerio, jsdom, etc.)
  → Extract structured data
  → Write to output file (JSON, CSV, etc.)

Post-processing (optional):
  → Normalize/deduplicate
  → Enrich with derived fields
  → Validate against schema
```

### Shared Utilities (`scraper-utils.mjs`)

| Function | Purpose |
|----------|---------|
| `fetchPage(url, retries, headers, cacheFile, force)` | HTTP fetch with retry, backoff, HTML caching |
| `sleep(ms)` | Rate limiting between requests |
| `loadCache(filename)` / `saveCache(filename, map)` | Progress cache for crash recovery |
| `clearCache(filename)` | Delete progress cache |
| `loadExistingData(path)` | Load existing output for incremental mode |

### HTML Caching

Raw HTTP responses are cached locally (e.g., `.scrape-cache/`). Benefits:

- Iterate on parsing logic without re-fetching
- Reduce load on source servers
- Faster development cycles

Use `--force` flag to bypass cache when needed.

### Resume Capability

Save progress periodically (every N items) to a progress cache file. On restart:

1. Load progress cache
2. Skip already-processed items
3. Continue from where you left off

This prevents losing hours of work on long scrapes.

## Index Discovery Methods

Try in order of preference:

| Method | How to detect | Reliability |
|--------|---------------|-------------|
| API | Check `/api/`, `/wp-json/`, GraphQL endpoints | Best — structured, paginated |
| Sitemap | `GET /sitemap.xml` | Good — comprehensive coverage |
| RSS/Atom | `GET /feed/`, `/rss/` | Limited — often only recent items |
| HTML scraping | Manual inspection of index pages | Fragile — breaks on redesign |

## Best Practices

### Rate Limiting

```javascript
const DELAY_MS = 1000; // Minimum 500ms between requests

for (const url of urls) {
  await fetchPage(url);
  await sleep(DELAY_MS);
}
```

Adjust based on site size and your relationship with the source.

### Retry with Backoff

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      console.error(`[${response.status}] ${url} (attempt ${attempt})`);
    } catch (err) {
      console.error(`[ERROR] ${url} (attempt ${attempt}): ${err.message}`);
    }

    if (attempt < maxRetries) {
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
  return null;
}
```

### Respectful Headers

```javascript
const headers = {
  'User-Agent': 'YourBot/1.0 (https://yoursite.com/bot-info; contact@yoursite.com)',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};
```

Include contact info so site owners can reach you if needed.

### Attribution Metadata

Always include provenance in your output:

```json
{
  "attribution": {
    "source": "example.com",
    "sourceUrl": "https://example.com/page",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "scrapedAt": "2024-01-15T10:30:00Z"
  },
  "data": [...]
}
```

## Error Handling

| Error Type | Handling |
|------------|----------|
| Network timeout | Retry with backoff |
| 404 Not Found | Skip item, continue scraping |
| 429 Too Many Requests | Back off significantly, reduce rate |
| 5xx Server Error | Retry with backoff |
| Parse error | Log warning, skip item, continue |
| Cache corruption | Log warning, continue without cache |

Never let a single failure crash the entire scrape.

## Anti-Patterns

- **No rate limiting** — hammering servers gets you blocked and is disrespectful
- **No caching** — re-fetching everything on every run wastes bandwidth
- **No resume capability** — losing hours of progress on crash
- **Hardcoded pagination** — breaks when page count changes
- **Ignoring robots.txt** — legal and ethical issues
- **Missing attribution** — violates licenses, makes data unusable
- **Silent failures** — swallowing errors without logging
- **Scraping without permission** — check licenses first

## Adding a New Source

### Checklist

1. [ ] Verify license permits scraping and your intended use
2. [ ] Check robots.txt
3. [ ] Identify best index method (API > sitemap > RSS > HTML)
4. [ ] Create scraper with rate limiting, retry, caching, resume
5. [ ] Include full attribution metadata
6. [ ] Document the source in LICENSE-DATA or equivalent
7. [ ] Test with `--force` to verify fresh fetching works
8. [ ] Test resume by interrupting mid-scrape

### Scraper Template

```javascript
import { fetchPage, sleep, loadCache, saveCache, clearCache } from './scraper-utils.mjs';

const SOURCE = 'example.com';
const CACHE_FILE = `${SOURCE}-progress.json`;
const DELAY_MS = 1000;
const SAVE_INTERVAL = 10;

async function scrape() {
  const cache = loadCache(CACHE_FILE);
  const urls = await discoverUrls();

  let processed = 0;
  for (const url of urls) {
    if (cache.has(url)) continue; // Already processed

    const html = await fetchPage(url, 3, {}, `${SOURCE}-html.json`);
    if (!html) continue;

    const data = parseHtml(html);
    cache.set(url, data);

    if (++processed % SAVE_INTERVAL === 0) {
      saveCache(CACHE_FILE, cache);
    }

    await sleep(DELAY_MS);
  }

  saveCache(CACHE_FILE, cache);
  writeOutput(cache);
  clearCache(CACHE_FILE);
}
```

## Post-Processing Pipeline

Separate concerns into discrete steps:

1. **Scrape** — fetch and parse raw data
2. **Normalize** — clean, deduplicate, standardize formats
3. **Enrich** — add derived fields, inferred categories
4. **Validate** — check against schema, report anomalies

Each step reads from previous output and writes its own. This allows:
- Re-running individual steps without re-scraping
- Easier debugging (inspect intermediate outputs)
- Swapping out individual steps
