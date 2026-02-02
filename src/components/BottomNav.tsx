/**
 * BottomNav Component — mobile-only fixed bottom navigation bar
 *
 * Three-zone layout:
 * - Left: Home button
 * - Center: Hamburger menu (spans available width), expands upward
 * - Right: Play/session button (contextual icon based on active session)
 *
 * The expanding menu provides access to Favorites, History, Credits, and GitHub.
 * Hidden on sm+ breakpoints where these links live in the top bar and footer.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Menu, X, Star, Clock, ScrollText, Github, PlusCircle, CirclePlay, Sun, Moon } from 'lucide-react';
import { useSession } from '../context/SessionContext';

const menuItems = [
  { to: '/favorites', icon: Star, label: 'Favorites' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/credits', icon: ScrollText, label: 'Credits & Licenses' },
] as const;

interface BottomNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function BottomNav({ theme, onToggleTheme }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { state } = useSession();
  const location = useLocation();

  // Close menu on any navigation — reacting to route changes is a legitimate
  // use of setState-in-effect (syncing UI state with an external value).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close menu on Escape key — standard keyboard accessibility pattern
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [menuOpen, handleEscape]);

  // Three session states:
  // 1. No session → PlusCircle → /prep
  // 2. Mid-session (exerciseIndex set) → CirclePlay → /session/:id
  // 3. Exercises done, notes phase (exerciseIndex null but exercises have actualSeconds) → CirclePlay → /notes/:id
  const hasRunningSession =
    state.currentSession !== null && state.currentExerciseIndex !== null;
  const hasFinishedExercises =
    state.currentSession !== null &&
    state.currentExerciseIndex === null &&
    state.currentSession.exercises.some((ex) => ex.actualSeconds != null);
  const hasActiveSession = hasRunningSession || hasFinishedExercises;

  const sessionUrl = hasRunningSession
    ? `/session/${state.currentSession!.id}`
    : hasFinishedExercises
      ? `/notes/${state.currentSession!.id}`
      : '/prep';

  return (
    <>
      {/* Backdrop overlay — not keyboard-interactive; users dismiss via Escape or menu items */}
      {menuOpen && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-50">
        {/* Expanding menu panel */}
        {menuOpen && (
          <div className="bg-card border-t py-2" role="menu" id="bottom-nav-menu" aria-label="Navigation menu">
            {menuItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                className="flex items-center gap-3 px-6 py-3 text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
            <a
              href="https://github.com/ISmarsh/build-a-jam"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center gap-3 px-6 py-3 text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <button
              onClick={onToggleTheme}
              role="menuitem"
              className="w-full flex items-center gap-3 px-6 py-3 text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        )}

        {/* Bottom bar */}
        <div className="bg-card border-t flex items-stretch">
          {/* Home */}
          <Link
            to="/"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`flex items-center justify-center px-4 py-3 transition-colors ${
              location.pathname === '/'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
          </Link>

          {/* Menu — spans available space */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors border-x"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="bottom-nav-menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">Menu</span>
          </button>

          {/* Build / Resume session — highlights when on /prep */}
          <Link
            to={sessionUrl}
            className={`flex items-center justify-center px-4 py-3 transition-colors ${
              hasActiveSession
                ? 'text-primary hover:text-primary-hover'
                : location.pathname === '/prep'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={hasActiveSession ? 'Resume session' : 'Build a session'}
          >
            {hasActiveSession ? (
              <CirclePlay className="w-6 h-6" />
            ) : (
              <PlusCircle className="w-6 h-6" />
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}

export default BottomNav;
