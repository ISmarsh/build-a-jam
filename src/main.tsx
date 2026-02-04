import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

/**
 * LEARNING NOTE - ROUTER PLACEMENT:
 *
 * Angular: RouterModule is configured in AppModule or via provideRouter()
 * React:   BrowserRouter wraps the entire app at the top level
 *
 * We place it here (not in App.tsx) so that App and all its children
 * can use routing hooks like useNavigate, Link, etc.
 *
 * The basename must match vite.config.ts `base`. In dev mode Vite uses '/',
 * in production builds it uses '/build-a-jam/' for GitHub Pages.
 * import.meta.env.BASE_URL is set automatically by Vite from the `base` config.
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
