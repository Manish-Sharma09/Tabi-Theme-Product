/* ==========================================================================
   home-hero.js
   The slideshow behaviour for sections/home-hero.liquid.

   The section renders every slide server-side with the first one already
   showing, so this file adds behaviour only: changing slides, autoplay, the
   pause button, swipe and keys. With it blocked the first slide still shows,
   complete and clickable.

   Autoplay holds while the pointer is over the banner, while anything in it
   has keyboard focus, while it is scrolled out of view, and while the tab is
   hidden; it does not start at all under prefers-reduced-motion. The pause
   button is the shopper's own choice and outranks all of those.
   ========================================================================== */

(() => {
  const SWIPE_DISTANCE = 45;

  class HomeHero extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('.home-hero__slide'));
      this.dots = Array.from(this.querySelectorAll('[data-hero-dot]'));
      this.pauseButton = this.querySelector('[data-hero-pause]');
      this.status = this.querySelector('[data-hero-status]');
      this.index = Math.max(0, this.slides.findIndex((slide) => slide.classList.contains('is-active')));
      this.speed = (parseInt(this.dataset.speed, 10) || 6) * 1000;

      if (this.slides.length < 2) return;

      // Why the slideshow is holding. Autoplay runs only while the set is empty.
      this.holds = new Set();
      this.autoplay = this.dataset.autoplay === 'true';
      if (this.autoplay && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.holds.add('user');
      }

      this.querySelector('[data-hero-prev]')?.addEventListener('click', () => this.step(-1, true));
      this.querySelector('[data-hero-next]')?.addEventListener('click', () => this.step(1, true));
      this.dots.forEach((dot) =>
        dot.addEventListener('click', () => this.go(parseInt(dot.dataset.heroDot, 10), true))
      );
      this.pauseButton?.addEventListener('click', () => this.togglePause());

      this.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') this.step(-1, true);
        if (event.key === 'ArrowRight') this.step(1, true);
      });

      this.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') this.hold('hover');
      });
      this.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') this.release('hover');
      });
      this.addEventListener('focusin', () => this.hold('focus'));
      this.addEventListener('focusout', (event) => {
        if (!this.contains(event.relatedTarget)) this.release('focus');
      });

      this.bindSwipe();

      this.onVisibility = () => (document.hidden ? this.hold('hidden') : this.release('hidden'));
      document.addEventListener('visibilitychange', this.onVisibility);

      this.observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? this.release('offscreen') : this.hold('offscreen')),
        { threshold: 0.25 }
      );
      this.observer.observe(this);

      // Theme editor: selecting a slide's block shows that slide and holds it.
      this.addEventListener('shopify:block:select', (event) => {
        const position = this.slides.indexOf(event.target.closest?.('.home-hero__slide') || event.target);
        if (position > -1) this.go(position, false);
        this.hold('editor');
      });
      this.addEventListener('shopify:block:deselect', () => this.release('editor'));

      this.syncPauseButton();
      this.schedule();
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      clearTimeout(this.leaveTimer);
      this.observer?.disconnect();
      document.removeEventListener('visibilitychange', this.onVisibility);
    }

    step(direction, fromUser) {
      this.go((this.index + direction + this.slides.length) % this.slides.length, fromUser);
    }

    go(target, fromUser) {
      if (target === this.index || !this.slides[target]) return;

      const outgoing = this.slides[this.index];
      const incoming = this.slides[target];

      // A slide still finishing an earlier fade is dropped at once, so two
      // quick clicks never leave three slides stacked.
      this.slides.forEach((slide) => {
        if (slide !== outgoing) slide.classList.remove('is-leaving');
        slide.classList.remove('is-first-paint');
      });

      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
      outgoing.setAttribute('inert', '');

      incoming.classList.remove('is-leaving');
      // Reflow so the incoming slide's zoom restarts from its resting scale
      // even when it was the slide that left a moment ago.
      void incoming.offsetWidth;
      incoming.classList.add('is-active');
      incoming.removeAttribute('inert');

      clearTimeout(this.leaveTimer);
      const fade = parseFloat(getComputedStyle(this).getPropertyValue('--hero-fade')) || 1.1;
      this.leaveTimer = setTimeout(() => outgoing.classList.remove('is-leaving'), fade * 1000 + 50);

      this.index = target;
      this.dots.forEach((dot, position) =>
        dot.setAttribute('aria-current', position === target ? 'true' : 'false')
      );

      // Announce only changes the shopper asked for. Announcing every autoplay
      // tick would talk over whatever else they are reading.
      if (fromUser && this.status) {
        this.status.textContent = incoming.getAttribute('aria-label') || '';
      }

      this.schedule();
    }

    schedule() {
      clearTimeout(this.timer);
      if (!this.autoplay || this.holds.size > 0) return;
      this.timer = setTimeout(() => this.step(1, false), this.speed);
    }

    hold(reason) {
      this.holds.add(reason);
      clearTimeout(this.timer);
    }

    release(reason) {
      this.holds.delete(reason);
      this.schedule();
    }

    togglePause() {
      if (this.holds.has('user')) {
        // Pressing play is an explicit request, so it also overrides the
        // automatic hover and focus holds - the pointer and focus are both on
        // the button at that moment. Advance at once rather than after another
        // full interval: the shopper pressed play to see the next slide.
        ['user', 'hover', 'focus'].forEach((reason) => this.holds.delete(reason));
        if (this.holds.size === 0) this.step(1, false);
      } else {
        this.hold('user');
      }
      this.syncPauseButton();
    }

    syncPauseButton() {
      const paused = this.holds.has('user');
      this.classList.toggle('is-paused', paused);
      if (!this.pauseButton) return;
      this.pauseButton.setAttribute(
        'aria-label',
        paused ? this.pauseButton.dataset.playLabel : this.pauseButton.dataset.pauseLabel
      );
    }

    bindSwipe() {
      const track = this.querySelector('.home-hero__track');
      let start = null;
      let swiped = false;

      track.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') return;
        start = { x: event.clientX, y: event.clientY };
        swiped = false;
      });

      track.addEventListener('pointerup', (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        start = null;
        if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        swiped = true;
        this.hold('user');
        this.syncPauseButton();
        this.step(dx < 0 ? 1 : -1, true);
      });

      track.addEventListener('pointercancel', () => {
        start = null;
      });

      // The slide is one big link; a swipe must not also follow it.
      track.addEventListener(
        'click',
        (event) => {
          if (!swiped) return;
          swiped = false;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
    }
  }

  if (!customElements.get('home-hero')) customElements.define('home-hero', HomeHero);
})();
