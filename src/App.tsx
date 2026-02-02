/**
 * App Component - Layout shell and route definitions
 *
 * LEARNING NOTES - REACT ROUTER:
 *
 * 1. ANGULAR vs REACT ROUTING:
 *    Angular: RouterModule with route configs, <router-outlet>
 *    React:   <Routes> with nested <Route> elements, <Outlet> for nesting
 *
 * 2. KEY DIFFERENCES:
 *    - Angular routes are configured in a separate module/array
 *    - React routes are JSX elements — they live right in the component tree
 *    - Angular uses routerLink directive; React uses <Link> component
 *    - Both support lazy loading, guards (React uses loaders/actions in v6+)
 *
 * 3. LAYOUT PATTERN:
 *    The App component renders the shared layout (header, footer) and uses
 *    <Routes> to swap out the main content area. This is similar to Angular's
 *    AppComponent template with a <router-outlet>.
 */

import { Routes, Route, Link } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { useTheme } from './hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import HomePage from './components/HomePage';
import PrepPage from './components/PrepPage';
import SessionPage from './components/SessionPage';
import NotesPage from './components/NotesPage';
import HistoryPage from './components/HistoryPage';
import FavoritesPage from './components/FavoritesPage';
import CreditsPage from './components/CreditsPage';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 py-8 pb-20 sm:pb-8 sm:px-6 lg:px-8">
        <header className="text-center mb-8 sm:mb-12 pb-6 sm:pb-8 border-b-2 border-primary flex-shrink-0">
          {/* Three-column flex: invisible spacer | title | toggle button.
              The spacer matches the toggle width so the title stays centered. */}
          <div className="flex justify-between items-start">
            <div className="w-9" aria-hidden="true" />
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl sm:text-5xl font-bold mb-2 text-primary">Build-a-Jam</h1>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Your improv exercise library - Plan sessions with confidence
          </p>
        </header>

        {/* ROUTES: Main content area that grows to push footer down */}
        <main className="flex-1 mb-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/prep" element={<PrepPage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/notes/:id" element={<NotesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/credits" element={<CreditsPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
      <BottomNav theme={theme} onToggleTheme={toggleTheme} />
      <Toaster position="bottom-center" duration={3000} richColors />
    </SessionProvider>
  );
}

export default App;
