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
    <footer className="hidden sm:block sticky bottom-0 py-6 border-t text-center text-muted-foreground text-sm flex-shrink-0 bg-background">
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          to="/credits"
          className="text-muted-foreground hover:text-primary transition-colors underline"
        >
          Credits &amp; Licenses
        </Link>
        <span className="text-gray-600" aria-hidden="true">&middot;</span>
        <a
          href="https://github.com/ISmarsh/build-a-jam"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors underline"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;
