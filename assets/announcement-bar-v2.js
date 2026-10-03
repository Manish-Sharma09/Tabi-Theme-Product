/* ==========================================================================
   announcement-bar-v2.js - version: Good Earth layout, 2026-10-03
   Behaviour for sections/announcement-bar-v2.liquid. A custom element, so
   the theme editor's section reloads re-run its setup on the fresh markup.
   ========================================================================== */

(() => {
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     <tabi-announcements>

     Shows one message at a time and moves to the next every `data-interval`
     ms; the ring round the pause button is a CSS animation of the same
     length, restarted with each message. The pause button stops both, and
     so - for as long as it lasts - does a pointer or keyboard focus resting
     on the strip, so nobody has a link move out from under them.
     ------------------------------------------------------------------------ */

  class TabiAnnouncements extends HTMLElement {
    connectedCallback() {
      this.messages = Array.from(this.querySelectorAll('.tabi-strip__message'));
      this.toggle = this.querySelector('.tabi-strip__toggle');
      // "Rotate messages" off, or a single message: the first one just stays.
      if (this.messages.length < 2 || !this.hasAttribute('data-autoplay')) return;

      this.interval = Number(this.dataset.interval) || 5000;
      this.index = Math.max(0, this.messages.findIndex((message) => message.classList.contains('is-active')));
      this.userPaused = false;
      this.holds = new Set();

      this.toggle?.addEventListener('click', () => {
        this.userPaused = !this.userPaused;
        this.toggle.setAttribute('aria-pressed', String(this.userPaused));
        this.toggle.setAttribute('aria-label', this.userPaused ? this.toggle.dataset.labelPlay : this.toggle.dataset.labelPause);
        this.sync();
      });

      const hold = (reason) => () => {
        this.holds.add(reason);
        this.sync();
      };
      const release = (reason) => () => {
        this.holds.delete(reason);
        this.sync();
      };
      const messages = this.querySelector('.tabi-strip__messages');
      messages.addEventListener('pointerenter', hold('pointer'));
      messages.addEventListener('pointerleave', release('pointer'));
      messages.addEventListener('focusin', hold('focus'));
      messages.addEventListener('focusout', (event) => {
        if (!messages.contains(event.relatedTarget)) release('focus')();
      });

      this.onVisibility = () => (document.hidden ? hold('hidden')() : release('hidden')());
      document.addEventListener('visibilitychange', this.onVisibility);

      this.remaining = this.interval;
      this.startCountdown();
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      document.removeEventListener('visibilitychange', this.onVisibility);
    }

    get paused() {
      return this.userPaused || this.holds.size > 0;
    }

    /* Pause or resume the timer to match the current state. The time left on
       the current message is kept, so the ring and the change stay in step. */
    sync() {
      this.classList.toggle('is-paused', this.paused);
      if (this.paused) {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
          this.remaining = Math.max(0, this.remaining - (performance.now() - this.startedAt));
        }
      } else if (!this.timer) {
        this.startedAt = performance.now();
        this.timer = setTimeout(() => this.next(), this.remaining);
      }
    }

    startCountdown() {
      this.remaining = this.interval;
      // Restart the ring: drop the animation, force a style flush, add it back.
      this.classList.remove('is-counting');
      void this.offsetWidth;
      this.classList.add('is-counting');
      clearTimeout(this.timer);
      this.timer = null;
      this.sync();
    }

    next() {
      this.timer = null;
      const current = this.messages[this.index];
      this.index = (this.index + 1) % this.messages.length;
      const incoming = this.messages[this.index];

      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      incoming.classList.remove('is-leaving', 'is-parking');
      incoming.classList.add('is-active');

      // Once it has gone, move the old message back below the strip without
      // a transition, ready to rise in again on its next turn.
      setTimeout(() => {
        if (current.classList.contains('is-active')) return;
        current.classList.add('is-parking');
        current.classList.remove('is-leaving');
        void current.offsetWidth;
        current.classList.remove('is-parking');
      }, reducedMotion() ? 0 : 700);

      this.startCountdown();
    }
  }

  if (!customElements.get('tabi-announcements')) customElements.define('tabi-announcements', TabiAnnouncements);
})();
