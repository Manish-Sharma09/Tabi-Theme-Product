/* ==========================================================================
   home-sections.js
   The carousel layout of sections/home-cards.liquid.

   The cards are a plain scrolling list with scroll snapping, so they swipe
   on a phone and scroll on a trackpad with no script at all. This adds the
   desktop arrows, which step one card and wrap round at either end like the
   reference's endless slider, and the phone dots, one per screenful.

   A mouse can also drag the row. Touch keeps the browser's own swipe; a pen
   or a mouse drag of more than a few pixels never opens the card under it.
   ========================================================================== */

(() => {
  class HomeCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.home-carousel__track');
      this.slides = Array.from(this.querySelectorAll('.home-carousel__slide'));
      this.dotsWrap = this.querySelector('.home-carousel__dots');
      if (!this.track || this.slides.length === 0) return;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.querySelector('[data-carousel-prev]')?.addEventListener('click', () => this.step(-1));
      this.querySelector('[data-carousel-next]')?.addEventListener('click', () => this.step(1));

      this.onScroll = () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.syncDots());
      };
      this.track.addEventListener('scroll', this.onScroll, { passive: true });

      this.resizeObserver = new ResizeObserver(() => this.layout());
      this.resizeObserver.observe(this.track);

      this.bindDrag();

      // Theme editor: selecting a card's block brings that card into view.
      this.addEventListener('shopify:block:select', (event) => {
        const slide = event.target.closest?.('.home-carousel__slide');
        if (slide) this.scrollToLeft(slide.offsetLeft - this.track.offsetLeft - this.paddingStart(), false);
      });

      this.layout();
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.track?.removeEventListener('scroll', this.onScroll);
      cancelAnimationFrame(this.frame);
      this.endDrag?.();
    }

    // Mouse drag. The window listeners exist only while a button is down.
    bindDrag() {
      const DRAG_START = 6;
      let start = null;
      let dragged = false;

      const onMove = (event) => {
        if (!start) return;
        const distance = event.clientX - start.x;
        if (!dragged && Math.abs(distance) > DRAG_START) {
          dragged = true;
          this.classList.add('is-dragging');
        }
        if (dragged) {
          event.preventDefault();
          this.track.scrollLeft = start.left - distance;
        }
      };

      this.endDrag = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', this.endDrag);
        window.removeEventListener('pointercancel', this.endDrag);
        start = null;
        // Removing the class turns snapping back on, and the row settles on
        // the nearest card by itself.
        this.classList.remove('is-dragging');
      };

      this.track.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || this.classList.contains('is-static')) return;
        start = { x: event.clientX, left: this.track.scrollLeft };
        dragged = false;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', this.endDrag);
        window.addEventListener('pointercancel', this.endDrag);
      });

      // The click that ends a drag is not a click on the card.
      this.track.addEventListener(
        'click',
        (event) => {
          if (!dragged) return;
          dragged = false;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );

      // Links and pictures would otherwise start the browser's own drag.
      this.track.addEventListener('dragstart', (event) => event.preventDefault());
    }

    maxScroll() {
      return Math.max(0, this.track.scrollWidth - this.track.clientWidth);
    }

    paddingStart() {
      return parseFloat(getComputedStyle(this.track).paddingLeft) || 0;
    }

    scrollToLeft(left, smooth = true) {
      const behavior = smooth && !this.reducedMotion.matches ? 'smooth' : 'auto';
      this.track.scrollTo({ left, behavior });
    }

    // One card left or right. At the last card "next" returns to the first,
    // and at the first "previous" goes to the last.
    step(direction) {
      const max = this.maxScroll();
      const current = this.track.scrollLeft;
      const pitch = this.slides[0].getBoundingClientRect().width || this.track.clientWidth;

      if (direction > 0 && current >= max - 2) return this.scrollToLeft(0);
      if (direction < 0 && current <= 2) return this.scrollToLeft(max);

      this.scrollToLeft(Math.min(max, Math.max(0, current + direction * pitch)));
    }

    layout() {
      const scrollable = this.maxScroll() > 2;
      this.classList.toggle('is-static', !scrollable);
      this.buildDots();
      this.syncDots();
    }

    // One dot per screenful, as the reference draws them under its phone
    // carousel; the last dot means "the end", wherever that falls.
    buildDots() {
      if (!this.dotsWrap) return;
      const width = this.track.clientWidth || 1;
      const count = this.maxScroll() > 2 ? Math.ceil(this.track.scrollWidth / width - 0.05) : 0;
      if (count === this.dotCount) return;
      this.dotCount = count;

      const label = this.dotsWrap.dataset.label || 'Slide';
      const of = this.dotsWrap.dataset.of || 'of';
      this.dotsWrap.replaceChildren();

      for (let page = 0; page < count; page += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'home-carousel__dot';
        dot.setAttribute('aria-label', `${label} ${page + 1} ${of} ${count}`);
        dot.addEventListener('click', () =>
          this.scrollToLeft(page === count - 1 ? this.maxScroll() : page * this.track.clientWidth)
        );
        this.dotsWrap.append(dot);
      }
    }

    syncDots() {
      if (!this.dotsWrap || !this.dotCount) return;
      const max = this.maxScroll();
      const left = this.track.scrollLeft;
      const current =
        left >= max - 2
          ? this.dotCount - 1
          : Math.min(this.dotCount - 1, Math.round(left / (this.track.clientWidth || 1)));

      Array.from(this.dotsWrap.children).forEach((dot, page) =>
        dot.setAttribute('aria-current', page === current ? 'true' : 'false')
      );
    }
  }

  if (!customElements.get('home-carousel')) customElements.define('home-carousel', HomeCarousel);
})();
