import { useEffect, RefObject } from 'react';

const FOCUSABLE = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      );

    const focusable = getFocusable();
    // Move focus into the drawer when it opens.
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }

      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && current === last) {
        first.focus();
        event.preventDefault();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active, containerRef]);
}
