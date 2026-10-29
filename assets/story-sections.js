/* ==========================================================================
   story-sections.js
   <story-swipe>: the phone swipe row of sections/story-gallery.liquid
   (styles in assets/story-sections.css, part 7).

   The row is a plain scrolling list with scroll snapping, so it swipes with
   no script at all. This adds one dot per picture under the row, marks the
   current one, and lets a dot bring its picture to the side margin. While
   the row does not scroll (desktop, or every picture fits) there are no
   dots and the list is not a tab stop.
   ========================================================================== */

(() => {
  class StorySwipe extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-swipe-track]');
      this.dotsWrap = this.querySelector('[data-swipe-dots]');
      if (!this.track || !this.dotsWrap) return;

      this.slides = Array.from(this.track.children);
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.onScroll = () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.sync());
      };
      this.track.addEventListener('scroll', this.onScroll, { passive: true });

      this.resizeObserver = new ResizeObserver(() => this.layout());
      this.resizeObserver.observe(this.track);

      // Theme editor: selecting a picture's block brings it into view.
      this.addEventListener('shopify:block:select', (event) => {
        const slide = this.slides.find((item) => item.contains(event.target));
        if (slide) this.goTo(this.slides.indexOf(slide), false);
      });

      this.layout();
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.track?.removeEventListener('scroll', this.onScroll);
      cancelAnimationFrame(this.frame);
    }

    maxScroll() {
      return Math.max(0, this.track.scrollWidth - this.track.clientWidth);
    }

    layout() {
      const scrollable = this.maxScroll() > 2;

      if (scrollable) {
        this.track.setAttribute('tabindex', '0');
      } else {
        this.track.removeAttribute('tabindex');
      }

      const count = scrollable ? this.slides.length : 0;
      if (count !== this.dotsWrap.children.length) this.buildDots(count);
      this.sync();
    }

    buildDots(count) {
      const label = this.dotsWrap.dataset.label || 'Picture';
      const of = this.dotsWrap.dataset.of || 'of';
      this.dotsWrap.replaceChildren();

      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'story-dot';
        dot.setAttribute('aria-label', `${label} ${index + 1} ${of} ${count}`);
        dot.addEventListener('click', () => this.goTo(index));
        this.dotsWrap.append(dot);
      }
    }

    // The picture nearest the side margin is the current one; at the end of
    // the row the last picture is, though it cannot reach the margin.
    current() {
      const left = this.track.scrollLeft;
      if (left >= this.maxScroll() - 2) return this.slides.length - 1;

      const start = this.slides[0].offsetLeft;
      let nearest = 0;
      this.slides.forEach((slide, index) => {
        if (Math.abs(slide.offsetLeft - start - left) < Math.abs(this.slides[nearest].offsetLeft - start - left)) {
          nearest = index;
        }
      });
      return nearest;
    }

    sync() {
      const dots = Array.from(this.dotsWrap.children);
      if (dots.length === 0) return;
      const current = this.current();
      dots.forEach((dot, index) => dot.setAttribute('aria-current', index === current ? 'true' : 'false'));
    }

    goTo(index, smooth = true) {
      const slide = this.slides[index];
      if (!slide) return;
      const left = Math.min(this.maxScroll(), slide.offsetLeft - this.slides[0].offsetLeft);
      this.track.scrollTo({ left, behavior: smooth && !this.reducedMotion.matches ? 'smooth' : 'auto' });
    }
  }

  if (!customElements.get('story-swipe')) customElements.define('story-swipe', StorySwipe);
})();
