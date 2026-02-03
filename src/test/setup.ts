/**
 * Vitest test setup — runs before each test file
 *
 * LEARNING NOTES - TEST SETUP:
 *
 * 1. @testing-library/jest-dom adds custom matchers like:
 *    - toBeInTheDocument()
 *    - toHaveTextContent()
 *    - toBeVisible()
 *
 * 2. This setup file is referenced in vitest.config.ts and runs
 *    automatically before tests execute.
 */

import '@testing-library/jest-dom/vitest';
