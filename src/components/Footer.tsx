/**
 * Footer Component
 *
 * Site-wide footer with links to the credits page and GitHub repo.
 *
 * ANGULAR vs REACT:
 * - Angular: routerLink directive for internal navigation
 * - React: <Link> component from react-router-dom (renders an <a> that
 *   does client-side navigation without a full page reload)
 */

import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="hidden sm:block py-6 border-t border-gray-700 text-center text-gray-500 text-sm flex-shrink-0">
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          to="/credits"
          className="text-gray-400 hover:text-indigo-400 transition-colors underline"
        >
          Credits &amp; Licenses
        </Link>
        <span className="text-gray-600" aria-hidden="true">&middot;</span>
        <a
          href="https://github.com/ISmarsh/build-a-jam"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-indigo-400 transition-colors underline"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;
