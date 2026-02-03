# Scraper Utilities

Reusable utilities and guidance for respectful web scraping.

## Files

- **scraper-utils.mjs** — Shared functions for HTTP fetching, caching, retry, and resume
- **SCRAPING-GUIDE.md** — Best practices, architecture patterns, and anti-patterns

## Usage

### As a Git Submodule

```bash
git submodule add https://github.com/YOUR_ORG/scraper-utils scripts/scraper-utils
```

Then import in your scraper:

```javascript
import {
  fetchPage,
  sleep,
  loadCache,
  saveCache,
  clearCache,
  loadExistingData,
} from './scraper-utils/scraper-utils.mjs';
```

### Direct Copy

Copy the files to your `scripts/` directory.

## API

### `fetchPage(url, retries?, headers?, cacheFile?, force?)`

Fetch a URL with retry logic, exponential backoff, and optional HTML caching.

- `url` — URL to fetch
- `retries` — Number of retry attempts (default: 3)
- `headers` — Additional headers to include
- `cacheFile` — HTML cache filename (null = no caching)
- `force` — Bypass cache and re-fetch (default: false)

Returns response text or null if all retries fail.

### `sleep(ms)`

Promise-based delay for rate limiting.

### `loadCache(filename)` / `saveCache(filename, map)`

Load/save a Map as JSON for progress tracking and crash recovery.

### `clearCache(filename)`

Delete a cache file.

### `loadExistingData(path)`

Load existing JSON output for incremental scraping.

## Cache Directory

Caches are stored in `.scrape-cache/` (add to `.gitignore`).

```gitignore
.scrape-cache/
```
