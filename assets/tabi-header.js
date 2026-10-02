/* ==========================================================================
   tabi-header.js
   Behaviour for sections/header.liquid: the desktop dropdowns (<tabi-nav>)
   and the mobile menu drawer (<tabi-drawer>).

   Both are custom elements so the theme editor's section reloads re-run their
   setup on the fresh markup without any extra event wiring.
   ========================================================================== */

(() => {
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
            item.querySelector('.tabi-nav__panel a')?.focus({ preventScroll: true });
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

     Open:  showModal(), then add .is-open two frames later, so the closed
            position has been painted once and the slide has somewhere to
            start from.
     Close: remove .is-open, wait for the panel's slide to finish, then
            close() the dialog. Escape is routed through the same path via the
            dialog's `cancel` event, so it animates too; the `close` event is
            the single place that tears down, whichever way the dialog shut.
     ------------------------------------------------------------------------ */

  class TabiDrawer extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      this.panel = this.querySelector('.tabi-drawer__panel');
      if (!this.dialog || !this.panel) return;

      this.openers = Array.from(document.querySelectorAll(`[aria-controls="${this.id}"]`));
      this.onOpenerClick = (event) => {
        event.preventDefault();
        this.open(event.currentTarget);
      };
      this.openers.forEach((button) => button.addEventListener('click', this.onOpenerClick));

      this.querySelectorAll('[data-tabi-drawer-close]').forEach((element) =>
        element.addEventListener('click', () => this.close())
      );

      this.dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        this.close();
      });

      this.dialog.addEventListener('close', () => this.teardown());

      this.querySelectorAll('.tabi-drawer__trigger').forEach((trigger) =>
        trigger.addEventListener('click', () => this.toggleRow(trigger))
      );

      // Rotating a tablet past the desktop breakpoint leaves no visible way to
      // close a drawer whose button has just been hidden.
      this.desktop = window.matchMedia('(min-width: 990px)');
      this.onBreakpoint = (event) => {
        if (event.matches) this.close(true);
      };
      this.desktop.addEventListener('change', this.onBreakpoint);
    }

    disconnectedCallback() {
      this.openers?.forEach((button) => button.removeEventListener('click', this.onOpenerClick));
      this.desktop?.removeEventListener('change', this.onBreakpoint);
      if (this.dialog?.open) this.dialog.close();
      this.teardown();
    }

    open(opener) {
      if (this.dialog.open) return;
      this.returnFocus = opener || document.activeElement;

      this.dialog.showModal();
      document.documentElement.classList.add('tabi-scroll-lock');
      this.openers.forEach((button) => button.setAttribute('aria-expanded', 'true'));

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.dialog.classList.add('is-open');
        })
      );

      // Focus the panel itself, not the close button: on iOS a script-moved
      // focus draws the focus ring, which boxed the X on every open. Keyboard
      // users land on the panel and Tab straight to the first control.
      this.panel.focus({ preventScroll: true });
    }

    close(immediately = false) {
      if (!this.dialog.open || this.closing) return;
      this.closing = true;
      this.dialog.classList.remove('is-open');

      if (immediately || reducedMotion()) {
        this.dialog.close();
        return;
      }

      const finish = (event) => {
        if (event && (event.target !== this.panel || event.propertyName !== 'transform')) return;
        this.panel.removeEventListener('transitionend', finish);
        clearTimeout(this.fallback);
        if (this.dialog.open) this.dialog.close();
      };

      this.panel.addEventListener('transitionend', finish);
      // transitionend never fires if the transition is interrupted or the
      // property did not change; the dialog must still shut.
      this.fallback = setTimeout(() => finish(), 700);
    }

    teardown() {
      this.closing = false;
      this.dialog?.classList.remove('is-open');
      document.documentElement.classList.remove('tabi-scroll-lock');
      this.openers?.forEach((button) => button.setAttribute('aria-expanded', 'false'));

      if (this.returnFocus && document.contains(this.returnFocus)) {
        this.returnFocus.focus({ preventScroll: true });
      }
      this.returnFocus = null;
    }

    toggleRow(trigger) {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
    }
  }

  if (!customElements.get('tabi-drawer')) customElements.define('tabi-drawer', TabiDrawer);
})();
