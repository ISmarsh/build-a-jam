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
import { Toaster } from './components/ui/sonner';
import HomePage from './components/HomePage';
import PrepPage from './components/PrepPage';
import SessionPage from './components/SessionPage';
import NotesPage from './components/NotesPage';
import HistoryPage from './components/HistoryPage';
import FavoritesPage from './components/FavoritesPage';
import CreditsPage from './components/CreditsPage';
import Footer from './components/Footer';

function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="text-center mb-12 pb-8 border-b-2 border-indigo-500 flex-shrink-0">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-5xl font-bold mb-2 text-indigo-500">Build-a-Jam</h1>
          </Link>
          <p className="text-gray-400 text-lg">
            Your improv exercise library - Plan sessions with confidence
          </p>
        </header>

        {/* ROUTES: Main content area that grows to push footer down */}
        <div className="flex-1 mb-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/prep" element={<PrepPage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/notes/:id" element={<NotesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/credits" element={<CreditsPage />} />
          </Routes>
        </div>

        <Footer />
      </div>
      <Toaster position="bottom-center" duration={3000} richColors />
    </SessionProvider>
  );
}

export default App;
