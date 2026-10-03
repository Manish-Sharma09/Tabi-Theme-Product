/* ==========================================================================
   tabi-header.js - version: Good Earth layout, 2026-10-03
   Behaviour for sections/header.liquid: the announcement strip
   (<tabi-announcements>), the desktop dropdowns (<tabi-nav>) and the mobile
   sliding menu (<tabi-drawer>).

   All three are custom elements so the theme editor's section reloads re-run
   their setup on the fresh markup without any extra event wiring.
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
      if (this.messages.length < 2) return;

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

  /* ------------------------------------------------------------------------
     <tabi-nav>

     Hover opens a panel after a short delay and closes it after a slightly
     longer one. The open delay stops a pointer sweeping across the bar from
     flashing every panel on the way; the close delay forgives a pointer that
     cuts a corner on its way down into a panel. Moving to another item hands
     over directly, because both go through the same timer.
     ------------------------------------------------------------------------ */

  const OPEN_DELAY = 90;
  const CLOSE_DELAY = 180;

  class TabiNav extends HTMLElement {
    connectedCallback() {
      this.items = Array.from(this.querySelectorAll('[data-tabi-nav-item]'));
      this.header = this.closest('.tabi-header');
      this.openItem = null;
      this.timer = null;

      this.items.forEach((item) => {
        const link = item.querySelector('.tabi-nav__link');
        const toggle = item.querySelector('.tabi-nav__toggle');

        item.addEventListener('pointerenter', (event) => {
          if (event.pointerType !== 'mouse') return;
          this.schedule(() => this.open(item), this.openItem ? 0 : OPEN_DELAY);
        });

        item.addEventListener('pointerleave', (event) => {
          if (event.pointerType !== 'mouse') return;
          this.schedule(() => this.close(item), CLOSE_DELAY);
        });

        toggle?.addEventListener('click', () => {
          if (item.classList.contains('is-open')) {
            this.close(item);
          } else {
            this.open(item);
            item.querySelector('.tabi-mega a')?.focus({ preventScroll: true });
          }
        });

        // A touch has no hover, so the first tap on a parent link opens its
        // panel and the second follows the link.
        link.addEventListener('pointerdown', (event) => {
          this.lastPointer = event.pointerType;
        });

        link.addEventListener('click', (event) => {
          const touched = this.lastPointer === 'touch' || this.lastPointer === 'pen';
          this.lastPointer = null;
          if (touched && !item.classList.contains('is-open')) {
            event.preventDefault();
            this.open(item);
          }
        });

        item.addEventListener('focusout', (event) => {
          if (!item.contains(event.relatedTarget)) this.close(item);
        });
      });

      this.onKeyup = (event) => {
        if (event.key !== 'Escape' || !this.openItem) return;
        const item = this.openItem;
        this.close(item);
        item.querySelector('.tabi-nav__toggle')?.focus({ preventScroll: true });
      };

      this.onDocumentClick = (event) => {
        if (this.openItem && !this.openItem.contains(event.target)) this.close(this.openItem);
      };

      document.addEventListener('keyup', this.onKeyup);
      document.addEventListener('click', this.onDocumentClick);
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      document.removeEventListener('keyup', this.onKeyup);
      document.removeEventListener('click', this.onDocumentClick);
    }

    schedule(callback, delay) {
      clearTimeout(this.timer);
      this.timer = setTimeout(callback, delay);
    }

    open(item) {
      clearTimeout(this.timer);
      if (this.openItem && this.openItem !== item) this.close(this.openItem);

      // A tall panel on a short laptop screen scrolls inside itself rather
      // than running off the bottom of the window.
      if (this.header) {
        const room = window.innerHeight - this.header.getBoundingClientRect().bottom;
        this.header.style.setProperty('--tabi-panel-max', `${Math.max(240, room)}px`);
      }

      item.classList.add('is-open');
      item.querySelector('.tabi-nav__toggle')?.setAttribute('aria-expanded', 'true');
      this.openItem = item;

      // The sticky header must not slide away from under an open panel.
      const wrapper = this.closest('.header-wrapper');
      if (wrapper) wrapper.preventHide = true;
    }

    close(item) {
      item.classList.remove('is-open');
      item.querySelector('.tabi-nav__toggle')?.setAttribute('aria-expanded', 'false');
      if (this.openItem === item) this.openItem = null;

      const wrapper = this.closest('.header-wrapper');
      if (wrapper && !this.openItem) wrapper.preventHide = false;
    }

    closeAll() {
      clearTimeout(this.timer);
      this.items.forEach((item) => this.close(item));
    }
  }

  if (!customElements.get('tabi-nav')) customElements.define('tabi-nav', TabiNav);

  /* ------------------------------------------------------------------------
     <tabi-drawer>

     The mobile menu. It hangs from the bottom of the bar, so the strip and
     the bar stay in view and the menu button itself turns into the X that
     closes it - which is why this is not a modal <dialog>: a dialog sits in
     the top layer, above the header, and would hide that button. Instead the
     page outside the header is made inert while the menu is open, and the
     header is raised above anything the page stacks over it.

     Open:  .is-active (visible), then .is-open two frames later, so the
            closed position has been painted once and the slide has somewhere
            to start from.
     Close: drop .is-open, wait for the panel's slide to finish, then drop
            .is-active and tidy up.

     Panes: level 1 and one pane per link with children. Opening a pane
     marks it .is-current; the CSS slides it in from the right and level 1
     out to the left.
     ------------------------------------------------------------------------ */

  class TabiDrawer extends HTMLElement {
    connectedCallback() {
      this.panel = this.querySelector('.tabi-drawer__panel');
      this.root = this.querySelector('.tabi-drawer__pane--root');
      if (!this.panel || !this.root) return;

      this.wrapper = this.closest('.header-wrapper');
      this.section = this.closest('.section-header') || document.querySelector('.section-header');
      this.header = this.wrapper?.querySelector('.tabi-header');
      this.openers = Array.from(document.querySelectorAll(`[aria-controls="${this.id}"]`));

      this.onOpenerClick = (event) => {
        event.preventDefault();
        if (this.classList.contains('is-active') && !this.closing) {
          this.close();
          return;
        }
        // A click fired from the keyboard (Enter/Space) has detail 0.
        this.openedByKeyboard = event.detail === 0;
        this.open(event.currentTarget);
      };
      this.openers.forEach((button) => button.addEventListener('click', this.onOpenerClick));

      this.querySelectorAll('[data-tabi-drawer-close]').forEach((element) =>
        element.addEventListener('click', () => this.close())
      );

      this.querySelectorAll('[data-tabi-pane-open]').forEach((button) =>
        button.addEventListener('click', (event) => {
          const pane = this.querySelector(`#${CSS.escape(button.getAttribute('aria-controls'))}`);
          this.showPane(pane, button, event.detail === 0);
        })
      );

      this.querySelectorAll('[data-tabi-pane-back]').forEach((button) =>
        button.addEventListener('click', (event) => this.showRoot(event.detail === 0))
      );

      this.querySelectorAll('.tabi-drawer__trigger').forEach((trigger) =>
        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', String(!expanded));
        })
      );

      this.setUpCountryFilter();

      this.onKeydown = (event) => {
        if (event.key !== 'Escape' || !this.classList.contains('is-active')) return;
        // Escape inside a panel steps back to level 1 first, then closes.
        if (this.currentPane && this.currentPane !== this.root) {
          this.showRoot(true);
        } else {
          this.openedByKeyboard = true;
          this.close();
        }
      };
      document.addEventListener('keydown', this.onKeydown);

      // Turning a tablet to landscape can cross into the desktop layout,
      // where the menu does not exist.
      this.desktop = window.matchMedia('(min-width: 990px)');
      this.onDesktop = () => {
        if (this.desktop.matches) this.close(true);
      };
      this.desktop.addEventListener('change', this.onDesktop);

      this.onResize = () => {
        if (this.classList.contains('is-active')) this.placeBelowBar();
      };
      window.addEventListener('resize', this.onResize);

      // The bag (Razorpay's sidecart) and the search both open over the page;
      // the menu gets out of their way. The bag is caught on the window in
      // the capture phase: Razorpay's own capture listener on <body> takes
      // the click there and it never reaches the link.
      this.onCartClick = (event) => {
        if (this.classList.contains('is-active') && event.target.closest?.('#cart-icon-bubble')) this.close(true);
      };
      window.addEventListener('click', this.onCartClick, true);
      this.wrapper?.querySelector('.header__search details')?.addEventListener('toggle', (event) => {
        if (event.target.open) this.close(true);
      });
    }

    disconnectedCallback() {
      this.openers?.forEach((button) => button.removeEventListener('click', this.onOpenerClick));
      document.removeEventListener('keydown', this.onKeydown);
      this.desktop?.removeEventListener('change', this.onDesktop);
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('click', this.onCartClick, true);
      clearTimeout(this.fallback);
      this.teardown();
    }

    placeBelowBar() {
      const bottom = this.header ? this.header.getBoundingClientRect().bottom : 0;
      this.style.setProperty('--tabi-drawer-top', `${Math.max(0, Math.round(bottom))}px`);
    }

    open(opener) {
      if (this.classList.contains('is-active') && !this.closing) return;
      clearTimeout(this.fallback);
      this.closing = false;
      this.returnFocus = opener || document.activeElement;

      // The header may be part-way through sliding back into view; pin it
      // fully shown before measuring where the menu should start.
      this.section?.classList.add('menu-open', 'tabi-menu-open');
      if (this.wrapper) this.wrapper.preventHide = true;
      this.wrapper?.querySelector('tabi-nav')?.closeAll?.();

      this.placeBelowBar();
      this.classList.add('is-active');
      document.documentElement.classList.add('tabi-scroll-lock');
      this.setPageInert(true);
      this.openers.forEach((button) => button.setAttribute('aria-expanded', 'true'));

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.placeBelowBar();
          this.classList.add('is-open');
        })
      );

      // Focus the panel itself, not the first control: on iOS a script-moved
      // focus draws the focus ring, which would box a row on every open.
      this.root.focus({ preventScroll: true });
    }

    close(immediately = false) {
      if (!this.classList.contains('is-active') || this.closing) return;
      this.closing = true;
      this.classList.remove('is-open');
      this.openers.forEach((button) => button.setAttribute('aria-expanded', 'false'));

      if (immediately || reducedMotion()) {
        this.teardown();
        return;
      }

      const finish = (event) => {
        if (event && (event.target !== this.panel || event.propertyName !== 'transform')) return;
        this.panel.removeEventListener('transitionend', finish);
        clearTimeout(this.fallback);
        if (this.closing) this.teardown();
      };

      this.panel.addEventListener('transitionend', finish);
      // transitionend never fires if the transition is interrupted or the
      // property did not change; the menu must still shut.
      this.fallback = setTimeout(() => finish(), 700);
    }

    teardown() {
      const wasActive = this.classList.contains('is-active');
      this.closing = false;
      this.classList.remove('is-open', 'is-active');
      document.documentElement.classList.remove('tabi-scroll-lock');
      this.setPageInert(false);
      this.section?.classList.remove('menu-open', 'tabi-menu-open');
      if (this.wrapper) this.wrapper.preventHide = false;
      this.openers?.forEach((button) => button.setAttribute('aria-expanded', 'false'));
      this.resetPanes();
      if (!wasActive) return;

      // Hand focus back to the menu button only for keyboard users. After a
      // tap, iOS draws the focus ring on a script-focused button.
      if (this.openedByKeyboard && this.returnFocus && document.contains(this.returnFocus)) {
        this.returnFocus.focus({ preventScroll: true });
      } else if (this.returnFocus && document.activeElement === this.returnFocus) {
        this.returnFocus.blur();
      } else if (this.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      this.returnFocus = null;
      this.openedByKeyboard = false;
    }

    /* Everything on the page except the header goes inert while the menu is
       open: no tabbing into it, no screen reader wandering into it. Only
       elements this script made inert are released again. */
    setPageInert(inert) {
      if (inert) {
        const header = this.section;
        this.inerted = Array.from(document.body.children).filter(
          (element) =>
            element !== header &&
            !element.contains(header) &&
            !element.inert &&
            !['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'].includes(element.tagName) &&
            // Third-party overlays (the Razorpay sidecart, chat widgets) must
            // keep working if they open on top of the menu.
            !/razorpay|magic|chat|widget/i.test(`${element.id} ${element.className}`)
        );
        this.inerted.forEach((element) => (element.inert = true));
      } else {
        this.inerted?.forEach((element) => (element.inert = false));
        this.inerted = null;
      }
    }

    showPane(pane, trigger, byKeyboard) {
      if (!pane) return;
      pane.scrollTop = 0;
      this.root.classList.remove('is-current');
      pane.classList.add('is-current');
      this.currentPane = pane;
      this.paneTrigger = trigger;
      trigger?.setAttribute('aria-expanded', 'true');
      const target = byKeyboard ? pane.querySelector('[data-tabi-pane-back]') : pane;
      target?.focus({ preventScroll: true });
    }

    showRoot(byKeyboard) {
      if (!this.currentPane || this.currentPane === this.root) return;
      this.currentPane.classList.remove('is-current');
      this.root.classList.add('is-current');
      this.currentPane = this.root;
      const trigger = this.paneTrigger;
      trigger?.setAttribute('aria-expanded', 'false');
      if (byKeyboard && trigger) {
        trigger.focus({ preventScroll: true });
      } else {
        this.root.focus({ preventScroll: true });
      }
    }

    resetPanes() {
      this.querySelectorAll('.tabi-drawer__pane--sub.is-current').forEach((pane) => pane.classList.remove('is-current'));
      this.querySelectorAll('[data-tabi-pane-open]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
      this.querySelectorAll('.tabi-drawer__trigger[aria-expanded="true"]').forEach((trigger) =>
        trigger.setAttribute('aria-expanded', 'false')
      );
      this.root?.classList.add('is-current');
      if (this.root) this.root.scrollTop = 0;
      this.currentPane = this.root;
      this.paneTrigger = null;
    }

    /* Long country lists get a filter box. Enter in it must not submit the
       form: that would pick whichever country button came first. */
    setUpCountryFilter() {
      const input = this.querySelector('[data-tabi-country-filter]');
      if (!input) return;
      const buttons = Array.from(this.querySelectorAll('.tabi-drawer__country'));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') event.preventDefault();
      });
      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        buttons.forEach((button) => {
          button.parentElement.hidden = query !== '' && !button.textContent.toLowerCase().includes(query);
        });
      });
    }
  }

  if (!customElements.get('tabi-drawer')) customElements.define('tabi-drawer', TabiDrawer);
})();
