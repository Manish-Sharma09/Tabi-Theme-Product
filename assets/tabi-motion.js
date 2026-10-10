/* ==========================================================================
   tabi-motion.js
   Scroll entrances and a light scroll drift for the home page sections and
   the footer's meadow (styles in assets/tabi-motion.css).

   - Each `[data-motion] [data-reveal]` element gets `.is-revealed` the first
     time it scrolls into view, and keeps it. Elements already on screen when
     the script runs are revealed at once, so nothing visible blinks out.
   - Each `[data-motion] [data-parallax]` element drifts up to that many
     pixels against the scroll while its section is on screen.

   Off entirely for visitors who ask for less motion and inside the theme
   editor: the page is then exactly the static design. Several sections load
   this file; the first copy to run does the work and later copies rescan.
   ========================================================================== */

(() => {
  if (window.TabiMotion) {
    window.TabiMotion.scan(document);
    return;
  }

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const inEditor = Boolean(window.Shopify && window.Shopify.designMode);
  const enabled = 'IntersectionObserver' in window && !reduceMotion.matches && !inEditor;

  const seen = new WeakSet();
  const drifting = new Set();
  const waiting = new Map();
  let frame = 0;

  // Entrances that start fully clipped (the illustrations) have no visible
  // area, and the browser measures intersection by visible area - they
  // would never count as on screen. Those are watched through their
  // unclipped parent instead.
  const CLIPPED = ['grow-left', 'grow-right', 'unroll', 'open', 'rise-up'];
  const watchTarget = (element) =>
    CLIPPED.includes(element.dataset.reveal) && element.parentElement ? element.parentElement : element;

  const revealObserver = enabled
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (waiting.get(entry.target) || []).forEach((element) => element.classList.add('is-revealed'));
            waiting.delete(entry.target);
            revealObserver.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      )
    : null;

  const driftObserver = enabled
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              drifting.add(entry.target);
            } else {
              drifting.delete(entry.target);
            }
          });
          requestDrift();
        },
        { rootMargin: '120px 0px' }
      )
    : null;

  // Drift is measured against the section (the moving element's own box
  // would include the drift it is given) and written in one pass after all
  // the reads.
  // The drift runs from its full amount (section entering at the bottom)
  // to nothing (section leaving at the top), always downward from where the
  // merchant placed the picture, so a picture pinned to a section's top edge
  // never slides out past it. Phones get half: less room, more scrolling.
  function drift() {
    frame = 0;
    const half = window.innerHeight / 2;
    const scale = window.innerWidth < 750 ? 0.5 : 1;
    const moves = [];

    drifting.forEach((element) => {
      const frameBox = (element.closest('[data-motion]') || element).getBoundingClientRect();
      const centre = frameBox.top + frameBox.height / 2;
      const progress = Math.max(-1, Math.min(1, (centre - half) / (half + frameBox.height / 2)));
      moves.push([element, ((progress + 1) / 2) * (parseFloat(element.dataset.parallax) || 0) * scale]);
    });

    moves.forEach(([element, offset]) => {
      element.style.translate = `0 ${offset.toFixed(1)}px`;
    });
  }

  function requestDrift() {
    if (!frame && drifting.size > 0) frame = requestAnimationFrame(drift);
  }

  function scan(scope) {
    if (!enabled) return;
    const container = scope && scope.querySelectorAll ? scope : document;
    const fold = window.innerHeight * 0.92;
    const fresh = Array.from(container.querySelectorAll('[data-motion] [data-reveal]')).filter(
      (element) => !seen.has(element)
    );

    // Read every position first, then write: one layout pass however many
    // sections share this script.
    const boxes = fresh.map((element) => element.getBoundingClientRect());
    fresh.forEach((element, index) => {
      seen.add(element);
      const box = boxes[index];
      if (box.top < fold && box.bottom > 0) {
        element.classList.add('is-revealed');
        return;
      }
      const target = watchTarget(element);
      if (!waiting.has(target)) {
        waiting.set(target, []);
        revealObserver.observe(target);
      }
      waiting.get(target).push(element);
    });

    // Observing an element twice is a no-op, so a rescan is safe.
    container.querySelectorAll('[data-motion] [data-parallax]').forEach((element) => {
      driftObserver.observe(element);
    });

    root.classList.add('tabi-motion');
  }

  if (enabled) {
    window.addEventListener('scroll', requestDrift, { passive: true });
    window.addEventListener('resize', requestDrift, { passive: true });

    // Asked for less motion mid-visit: show everything, stop drifting.
    reduceMotion.addEventListener?.('change', () => {
      if (!reduceMotion.matches) return;
      document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-revealed'));
      drifting.forEach((element) => element.style.removeProperty('translate'));
      drifting.clear();
    });
  }

  window.TabiMotion = { scan };
  scan(document);
})();
