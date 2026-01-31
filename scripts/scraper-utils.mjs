/**
 * Shared utilities for web scraping scripts.
 *
 * This module provides common functionality used across all scrapers:
 * - HTTP fetching with retry logic and HTML caching
 * - Rate limiting (sleep)
 * - Progress cache management for resume capability
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../.scrape-cache");

/**
 * Sleep for a specified number of milliseconds.
 * Used for rate limiting to avoid overwhelming servers.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Generic cache helpers (used by both HTML cache and progress cache)
// ---------------------------------------------------------------------------

/**
 * Ensure the .scrape-cache directory exists.
 */
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Load a JSON cache file from .scrape-cache/ and return as a Map.
 *
 * @param {string} cacheFileName - Filename within .scrape-cache/
 * @returns {Map<string, any>}
 */
function loadCacheFile(cacheFileName) {
  const cachePath = resolve(CACHE_DIR, cacheFileName);

  if (!existsSync(cachePath)) {
    return new Map();
  }

  try {
    const cacheData = JSON.parse(readFileSync(cachePath, "utf-8"));
    return new Map(Object.entries(cacheData));
  } catch (err) {
    console.error(`Failed to load cache from ${cachePath}:`, err.message);
    return new Map();
  }
}

/**
 * Save a Map as JSON to .scrape-cache/.
 *
 * @param {string} cacheFileName - Filename within .scrape-cache/
 * @param {Map<string, any>} dataMap - Data to save
 */
function saveCacheFile(cacheFileName, dataMap) {
  ensureCacheDir();
  const cachePath = resolve(CACHE_DIR, cacheFileName);
  const cacheObj = Object.fromEntries(dataMap);
  writeFileSync(cachePath, JSON.stringify(cacheObj, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// HTML cache (caches raw HTTP responses with 7-day TTL)
// ---------------------------------------------------------------------------

// In-memory cache maps, keyed by cache file name
const htmlCaches = new Map();

/**
 * Get cached HTML for a URL if it exists and is fresh (< 7 days old).
 */
function getCachedHtml(cacheFileName, url, force = false) {
  if (force) return null;

  if (!htmlCaches.has(cacheFileName)) {
    htmlCaches.set(cacheFileName, loadCacheFile(cacheFileName));
  }

  const cache = htmlCaches.get(cacheFileName);
  const entry = cache.get(url);

  if (!entry) return null;

  // Check if cache is fresh (< 7 days old)
  const fetchedAt = new Date(entry.fetchedAt);
  const now = new Date();
  const ageMs = now - fetchedAt;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  if (ageMs > maxAgeMs) {
    console.log(`  [CACHE EXPIRED] ${url} (age: ${Math.floor(ageMs / 1000 / 60 / 60)}h)`);
    return null;
  }

  return entry.html;
}

/**
 * Save HTML to cache with current timestamp.
 */
function setCachedHtml(cacheFileName, url, html) {
  if (!htmlCaches.has(cacheFileName)) {
    htmlCaches.set(cacheFileName, loadCacheFile(cacheFileName));
  }

  const cache = htmlCaches.get(cacheFileName);
  cache.set(url, {
    html,
    fetchedAt: new Date().toISOString(),
  });

  saveCacheFile(cacheFileName, cache);
}

// ---------------------------------------------------------------------------
// fetchPage — HTTP fetching with retry, backoff, and HTML caching
// ---------------------------------------------------------------------------

/**
 * Fetch a URL with retry logic, respectful headers, and persistent HTML caching.
 *
 * @param {string} url - URL to fetch
 * @param {number} retries - Number of retry attempts (default: 3)
 * @param {Record<string, string>} extraHeaders - Additional headers to include
 * @param {string} htmlCacheFile - HTML cache file name (default: null = no caching)
 * @param {boolean} force - Force refetch, ignore cache (default: false)
 * @returns {Promise<string|null>} - Response text or null if all retries fail
 */
export async function fetchPage(url, retries = 3, extraHeaders = {}, htmlCacheFile = null, force = false) {
  // Check HTML cache first if caching is enabled
  if (htmlCacheFile) {
    const cached = getCachedHtml(htmlCacheFile, url, force);
    if (cached) {
      console.log(`  [CACHE HIT] ${url}`);
      return cached;
    }
  }
  const baseUrl = new URL(url).origin;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    Referer: baseUrl,
    ...extraHeaders, // Allow override
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });

      if (!res.ok) {
        console.error(`  [${res.status}] ${url} (attempt ${attempt})`);
        if (attempt < retries) {
          await sleep(1000 * attempt); // Exponential backoff
        }
        continue;
      }

      const html = await res.text();

      // Save to HTML cache if caching is enabled
      if (htmlCacheFile) {
        setCachedHtml(htmlCacheFile, url, html);
      }

      return html;
    } catch (err) {
      console.error(`  [ERROR] ${url} (attempt ${attempt}): ${err.message}`);
      if (attempt < retries) {
        await sleep(1000 * attempt);
      }
    }
  }

  return null; // All retries failed
}

// ---------------------------------------------------------------------------
// Progress cache — resume capability for scrapers
// ---------------------------------------------------------------------------

/**
 * Load progress cache (for resume on crash).
 *
 * @param {string} cacheFileName - Name of the cache file (e.g., "learnimprov-progress.json")
 * @returns {Map<string, any>} - Map of cached data (slug -> exercise)
 */
export function loadCache(cacheFileName) {
  return loadCacheFile(cacheFileName);
}

/**
 * Save progress cache. Creates .scrape-cache/ if needed.
 *
 * @param {string} cacheFileName - Name of the cache file
 * @param {Map<string, any>} dataMap - Map to save
 */
export function saveCache(cacheFileName, dataMap) {
  saveCacheFile(cacheFileName, dataMap);
}

/**
 * Delete a cache file.
 *
 * @param {string} cacheFileName - Name of the cache file to delete
 */
export function clearCache(cacheFileName) {
  const cachePath = resolve(CACHE_DIR, cacheFileName);

  if (existsSync(cachePath)) {
    unlinkSync(cachePath);
    console.log(`  Cleaned up cache file`);
  }
}

/**
 * Load existing data file (for incremental updates).
 *
 * @param {string} dataPath - Path to the data JSON file
 * @returns {Object|null} - Parsed JSON or null if file doesn't exist
 */
export function loadExistingData(dataPath) {
  if (!existsSync(dataPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(dataPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to load existing data from ${dataPath}:`, err.message);
    return null;
  }
}
