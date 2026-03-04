/**
 * useInstallPrompt — Captures the browser's install prompt for PWA installation.
 *
 * LEARNING NOTES - PWA INSTALL PROMPT:
 *
 * The `beforeinstallprompt` event fires when the browser decides the app
 * is installable (valid manifest, service worker, HTTPS). We capture it
 * and defer it so we can show our own "Install App" button instead of
 * relying on the browser's built-in prompt.
 *
 * ANGULAR COMPARISON:
 *   Angular: @angular/pwa schematic + SwUpdate service handle SW lifecycle.
 *   React:   No built-in PWA support — we manage it manually with hooks.
 *   Both rely on the same browser APIs under the hood.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already running as installed PWA — nothing to offer
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    const onInstalled = () => {
      deferredPrompt.current = null;
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // prompt() is single-use — clear ref and hide button after interaction
  const installApp = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    deferredPrompt.current = null;
    setIsInstallable(false);
  }, []);

  return { isInstallable, installApp } as const;
}
