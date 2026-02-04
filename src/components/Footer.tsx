/**
 * Footer Component
 *
 * Site-wide footer with links to the credits page and GitHub repo.
 * Hidden on mobile (BottomNav provides navigation there).
 * Sticky on desktop so it stays visible at the bottom.
 *
 * ANGULAR vs REACT:
 * - Angular: routerLink directive for internal navigation
 * - React: <Link> component from react-router-dom (renders an <a> that
 *   does client-side navigation without a full page reload)
 */

import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="sticky bottom-0 hidden flex-shrink-0 border-t bg-background py-6 text-center text-sm text-muted-foreground sm:block">
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/credits"
          className="text-muted-foreground underline transition-colors hover:text-primary"
        >
          Credits &amp; Licenses
        </Link>
        <span className="text-gray-600" aria-hidden="true">
          &middot;
        </span>
        <a
          href="https://github.com/ISmarsh/build-a-jam"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline transition-colors hover:text-primary"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;
