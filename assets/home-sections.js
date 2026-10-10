/* ==========================================================================
   home-sections.js
   The carousel layout of sections/home-cards.liquid, and <home-video>, the
   framed video of sections/home-spotlight.liquid (end of file).

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

  /* ------------------------------------------------------------------------
     <home-video>: a muted, looping video in place of a picture (the
     spotlight band). An uploaded video plays while at least a third of it is
     on screen and pauses when it leaves; a YouTube or Vimeo link gets its
     player only when first needed. Visitors who ask for less motion see the
     picture or the video's first frame, with the play button. The button is
     always there: the video loops past five seconds.
     ------------------------------------------------------------------------ */
  class HomeVideo extends HTMLElement {
    connectedCallback() {
      this.file = this.querySelector('video');
      this.holder = this.querySelector('[data-embed-src]');
      this.button = this.querySelector('[data-video-toggle]');
      if (!this.file && !this.holder) return;

      this.userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.inView = false;

      this.button?.addEventListener('click', () => {
        this.userPaused = !this.userPaused;
        this.sync();
      });

      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.inView = entry.isIntersecting;
          this.sync();
        },
        { threshold: 0.33 }
      );
      this.observer.observe(this);
      this.sync();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    sync() {
      const play = this.inView && !this.userPaused;
      this.classList.toggle('is-paused', !play);
      if (this.button) {
        this.button.setAttribute(
          'aria-label',
          this.userPaused ? this.button.dataset.playLabel : this.button.dataset.pauseLabel
        );
      }

      if (this.file) {
        if (play) {
          this.file.play()?.catch(() => {});
        } else {
          this.file.pause();
        }
        return;
      }

      const frame = this.holder.querySelector('iframe');
      if (play && !frame) {
        this.build();
      } else if (frame) {
        this.command(frame, play ? 'play' : 'pause');
      }
    }

    build() {
      const frame = document.createElement('iframe');
      frame.src = this.holder.dataset.embedSrc;
      frame.title = this.getAttribute('aria-label') || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('aria-hidden', 'true');
      frame.addEventListener('load', () => {
        frame.dataset.loaded = 'true';
        // YouTube shows its title and controls for a moment as a video
        // starts; the picture underneath covers that until it clears.
        frame.revealTimer = setTimeout(() => frame.classList.add('is-ready'), 1600);
        if (frame.dataset.pending) this.command(frame, frame.dataset.pending);
      });
      this.holder.append(frame);
    }

    // YouTube (enablejsapi) and Vimeo both take commands by postMessage.
    command(frame, action) {
      if (!frame.dataset.loaded) {
        frame.dataset.pending = action;
        return;
      }
      delete frame.dataset.pending;
      // A paused player shows its own overlay (title, "More videos"), so it
      // fades out and the picture underneath stands in until it plays again.
      clearTimeout(frame.revealTimer);
      if (action === 'pause') {
        frame.classList.remove('is-ready');
      } else {
        frame.revealTimer = setTimeout(() => frame.classList.add('is-ready'), 1200);
      }
      const message =
        this.holder.dataset.embedType === 'youtube'
          ? { event: 'command', func: action === 'play' ? 'playVideo' : 'pauseVideo', args: '' }
          : { method: action };
      frame.contentWindow?.postMessage(JSON.stringify(message), '*');
    }
  }

  if (!customElements.get('home-video')) customElements.define('home-video', HomeVideo);
})();
