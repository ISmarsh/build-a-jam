/**
 * useSwipeToDismiss — swipe-down-to-close gesture for scrollable overlays
 *
 * LEARNING NOTES - IMPERATIVE EVENT LISTENERS:
 *
 * 1. WHY NOT onTouchMove in JSX?
 *    React attaches touch event listeners as "passive" by default for performance.
 *    Passive listeners cannot call e.preventDefault(), which we need to suppress
 *    page scroll during the dismiss drag. addEventListener() with { passive: false }
 *    gives us control. This is an "escape hatch" from React's event system.
 *
 * 2. WHY A REF FOR onDismiss?
 *    Event handlers registered in useEffect close over stale values — if the parent
 *    re-renders (and re-creates the callback), the handler never sees the new one.
 *    Storing the latest callback in a ref (the "latest ref" pattern) lets the
 *    handler always call the current version without re-registering listeners.
 *
 * 3. WHY LOCAL VARIABLES INSIDE useEffect?
 *    startY, active, currentDelta are mutable tracking values that don't need to
 *    trigger renders. Keeping them as local let variables inside the effect closure
 *    is cleaner than extra refs and avoids the overhead of useState.
 *
 * 4. SCROLL-AWARE GUARD:
 *    We only engage the dismiss gesture when the element is scrolled to the top
 *    (scrollTop === 0) and the user drags downward. Anything else falls through to
 *    normal scroll behavior.
 *
 * TODO: extract to .toolbox/hooks/ once BIO or OHM needs the same pattern.
 */

import { useRef, useState, useEffect } from 'react';
import type React from 'react';

interface SwipeToDismissOptions {
  /** Swipe distance in px needed to trigger dismiss (default: 80) */
  threshold?: number;
}

/**
 * Attach to any scrollable overlay container (e.g. a dialog).
 * Returns a ref to place on the element and a style to apply for visual feedback.
 *
 * When the user is scrolled to the top and swipes down past `threshold` px,
 * `onDismiss` is called. Normal scrolling is unaffected.
 *
 * Usage:
 *   const { ref, style } = useSwipeToDismiss(onClose);
 *   <DialogContent ref={ref} style={style} ...>
 */
export function useSwipeToDismiss<T extends HTMLElement = HTMLDivElement>(
  onDismiss: () => void,
  { threshold = 80 }: SwipeToDismissOptions = {},
): { ref: React.RefObject<T | null>; style: React.CSSProperties } {
  const ref = useRef<T | null>(null);
  const [translateY, setTranslateY] = useState(0);

  // "Latest ref" pattern — keeps the handler closure from going stale when
  // the parent re-renders and passes a new onDismiss reference.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startY = 0;
    let startScrollTop = 0;
    let active = false;
    let currentDelta = 0;

    function handleTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      startScrollTop = el!.scrollTop;
      active = false;
      currentDelta = 0;
    }

    function handleTouchMove(e: TouchEvent) {
      const dy = e.touches[0].clientY - startY;
      // Only engage when at scroll top and dragging down
      if (startScrollTop === 0 && dy > 0) {
        active = true;
        currentDelta = dy;
        setTranslateY(dy);
        e.preventDefault(); // requires { passive: false } below
      }
    }

    function handleTouchEnd() {
      if (!active) return;
      if (currentDelta >= threshold) {
        onDismissRef.current();
      }
      setTranslateY(0);
      active = false;
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold]); // onDismiss handled via ref above

  return {
    ref,
    style: {
      // Translate during drag (no transition); snap back smoothly on release
      transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
      transition: translateY > 0 ? 'none' : 'transform 200ms ease',
    },
  };
}
