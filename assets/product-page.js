/* ==========================================================================
   product-page.js
   Behaviour for the redesigned product detail page.

     A. <pdp-delivery-check>  pincode -> dispatch, delivery window, COD
     B. <pdp-carousel>        arrow buttons over a scroll-snap track
     C. <pdp-buy-now>         add to cart, then straight to checkout

   The information accordions below the buy box used to be a fourth element
   here, opening and closing an outer <details> layer at the 750px breakpoint.
   That section is now a flat list of <details> laid out by grid, so the browser
   handles it and there is nothing left to script.

   Loaded only by the product page's own sections, so it costs nothing on the
   rest of the store.

   Each behaviour is a custom element, which means no selector sweeps on
   DOMContentLoaded and no re-initialisation hooks: when product-info.js swaps
   the section HTML after a variant change, the browser upgrades the new
   elements on its own and disconnects the old ones.
   ========================================================================== */
(function () {
  'use strict';

  /* ====================================================================== */
  /* Shared helpers                                                          */
  /* ====================================================================== */

  /* Reads a JSON <script> child by class. Returns null rather than throwing on
     malformed JSON: a typo in a theme setting should degrade one widget, not
     take down every script that runs after it on the page. */
  function readJSON(root, selector) {
    var node = root.querySelector(selector);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      console.warn('[pdp] could not parse config in', selector, e);
      return null;
    }
  }

  /* Adds `count` working days to `date`, skipping Saturdays and Sundays.

     Public holidays are not modelled. Doing that properly needs a maintained
     per-year calendar, and a delivery estimate that is a day optimistic around
     Diwali is a smaller problem than a holiday list nobody updates after the
     first year. The copy says "estimated" for this reason. */
  function addWorkingDays(date, count) {
    var d = new Date(date.getTime());
    var added = 0;
    while (added < count) {
      d.setDate(d.getDate() + 1);
      var day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return d;
  }

  function formatDate(date, locale) {
    try {
      return new Intl.DateTimeFormat(locale || 'en-IN', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    } catch (e) {
      /* Intl is present everywhere this theme supports, but a bad locale tag
         from a translation would throw. Fall back rather than render nothing. */
      return date.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    }
  }

  /* Fills {placeholders} in a label string. */
  function interpolate(template, values) {
    return String(template || '').replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  /* Turns "400, 41 ,560" into ['400','41','560'], dropping blanks. Accepts
     newlines as well as commas so a merchant can paste a column from a
     spreadsheet into the textarea. */
  function parseList(value) {
    return String(value || '')
      .split(/[\s,]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function matchesAnyPrefix(pincode, prefixes) {
    for (var i = 0; i < prefixes.length; i++) {
      if (pincode.indexOf(prefixes[i]) === 0) return true;
    }
    return false;
  }

  /* ====================================================================== */
  /* A. DELIVERY CHECK                                                       */
  /* ====================================================================== */

  /* Static, in-theme serviceability. There is no courier API behind this: the
     estimate is dispatch time plus a transit band picked by pincode prefix.

     Zone rules arrive as lines of "prefixes | min | max", e.g.
       400,401,410 | 1 | 2
       11,12,13    | 2 | 4
     The first line whose prefix list matches wins, so put the tightest
     prefixes first. Anything unmatched falls back to the default band. */
  function parseZones(text) {
    return String(text || '')
      .split('\n')
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        var parts = line.split('|');
        if (parts.length < 3) return null;
        var min = parseInt(parts[1], 10);
        var max = parseInt(parts[2], 10);
        if (isNaN(min) || isNaN(max)) return null;
        return { prefixes: parseList(parts[0]), min: min, max: max };
      })
      .filter(Boolean);
  }

  var PDPDeliveryCheck = class extends HTMLElement {
    connectedCallback() {
      this.config = readJSON(this, '[data-pdp-delivery-config]') || {};
      this.labels = this.config.labels || {};
      this.zones = parseZones(this.config.zoneRules);
      this.blocked = parseList(this.config.blockedPrefixes);
      this.codPrefixes = parseList(this.config.codPrefixes);

      this.form = this.querySelector('form');
      this.input = this.querySelector('[data-pdp-pincode]');
      this.results = this.querySelector('[data-pdp-results]');
      this.error = this.querySelector('[data-pdp-error]');

      if (!this.form || !this.input || !this.results) return;

      this.onSubmit = this.onSubmit.bind(this);
      this.form.addEventListener('submit', this.onSubmit);

      /* Restore the last pincode this visitor checked. It is a convenience,
         not state anything depends on, so every access is guarded - private
         windows and browsers with site data blocked throw on read. */
      var saved = null;
      try {
        saved = window.localStorage.getItem('pdp-pincode');
      } catch (e) {
        /* no stored value; carry on with an empty field */
      }
      if (saved && /^\d{6}$/.test(saved)) {
        this.input.value = saved;
        this.check(saved);
      }
    }

    disconnectedCallback() {
      if (this.form) this.form.removeEventListener('submit', this.onSubmit);
    }

    onSubmit(event) {
      event.preventDefault();
      this.check(this.input.value.trim());
    }

    showError(message) {
      this.results.hidden = true;
      this.results.innerHTML = '';
      if (this.error) {
        this.error.textContent = message;
        this.error.hidden = false;
      }
    }

    clearError() {
      if (this.error) {
        this.error.hidden = true;
        this.error.textContent = '';
      }
    }

    check(pincode) {
      if (!/^\d{6}$/.test(pincode)) {
        this.showError(this.labels.invalid || 'Please enter a valid 6-digit pincode.');
        return;
      }

      if (this.blocked.length && matchesAnyPrefix(pincode, this.blocked)) {
        this.showError(interpolate(this.labels.unserviceable || 'Sorry, we do not deliver to {pincode} yet.', { pincode: pincode }));
        return;
      }

      try {
        window.localStorage.setItem('pdp-pincode', pincode);
      } catch (e) {
        /* Storage unavailable. The check still works for this pageview. */
      }

      this.clearError();
      this.render(pincode, this.transitFor(pincode));
    }

    transitFor(pincode) {
      for (var i = 0; i < this.zones.length; i++) {
        if (matchesAnyPrefix(pincode, this.zones[i].prefixes)) {
          return { min: this.zones[i].min, max: this.zones[i].max };
        }
      }
      return {
        min: parseInt(this.config.transitMin, 10) || 3,
        max: parseInt(this.config.transitMax, 10) || 7,
      };
    }

    render(pincode, transit) {
      var dispatchMin = parseInt(this.config.dispatchMin, 10) || 2;
      var dispatchMax = parseInt(this.config.dispatchMax, 10) || 5;

      var today = new Date();
      var from = addWorkingDays(today, dispatchMin + transit.min);
      var to = addWorkingDays(today, dispatchMax + transit.max);

      /* COD is available everywhere unless a prefix list narrows it. */
      var codOn = this.config.codEnabled !== false;
      var codHere = codOn && (this.codPrefixes.length === 0 || matchesAnyPrefix(pincode, this.codPrefixes));

      var locale = this.config.locale;
      var rows = [
        {
          icon: 'check-circle',
          ok: true,
          html: this.escape(interpolate(this.labels.deliveringTo || 'Delivering to {pincode}', { pincode: pincode })),
        },
        {
          icon: 'clock',
          html: this.escape(
            interpolate(this.labels.dispatch || 'Made to order in {min}–{max} working days', {
              min: dispatchMin,
              max: dispatchMax,
            })
          ),
        },
        {
          icon: 'calendar',
          html: this.escape(this.labels.estimated || 'Estimated delivery:') +
            ' <strong>' + this.escape(formatDate(from, locale)) + ' – ' + this.escape(formatDate(to, locale)) + '</strong>',
        },
      ];

      if (codOn) {
        rows.push({
          icon: 'check',
          html: this.escape(codHere ? this.labels.codYes || 'COD available at this pincode' : this.labels.codNo || 'COD not available at this pincode'),
        });
      }

      var icons = this.iconMarkup();
      this.results.innerHTML = rows
        .map(function (row) {
          return (
            '<li class="pdp-delivery__row' + (row.ok ? ' pdp-delivery__row--ok' : '') + '">' +
            (icons[row.icon] || '') +
            '<span>' + row.html + '</span>' +
            '</li>'
          );
        })
        .join('');
      this.results.hidden = false;
    }

    /* The result rows are built client side, so their icons cannot come from a
       Liquid render. Liquid puts the same four SVGs in a hidden template on the
       page and they are cloned from there - that keeps a single icon source
       (snippets/pdp-icon.liquid) instead of a second copy written in JS. */
    iconMarkup() {
      if (this._icons) return this._icons;
      var map = {};
      var template = this.querySelector('[data-pdp-icons]');
      if (template) {
        template.content.querySelectorAll('[data-icon]').forEach(function (node) {
          map[node.getAttribute('data-icon')] = node.innerHTML;
        });
      }
      this._icons = map;
      return map;
    }

    escape(value) {
      return String(value).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  };

  /* ====================================================================== */
  /* B. CAROUSEL                                                             */
  /* ====================================================================== */

  var PDPCarousel = class extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-pdp-track]');
      this.prev = this.querySelector('[data-pdp-prev]');
      this.next = this.querySelector('[data-pdp-next]');
      if (!this.track) return;

      this.onScroll = this.onScroll.bind(this);
      this.onPrev = this.scrollByPage.bind(this, -1);
      this.onNext = this.scrollByPage.bind(this, 1);

      this.track.addEventListener('scroll', this.onScroll, { passive: true });
      if (this.prev) this.prev.addEventListener('click', this.onPrev);
      if (this.next) this.next.addEventListener('click', this.onNext);

      /* Card images load lazily, so the track's scrollWidth is not final at
         upgrade time and the arrows would latch to a stale disabled state.
         Observing the element covers that and every later reflow. */
      if (window.ResizeObserver) {
        this.observer = new ResizeObserver(this.onScroll);
        this.observer.observe(this.track);
      }

      this.onScroll();
    }

    disconnectedCallback() {
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      if (this.prev) this.prev.removeEventListener('click', this.onPrev);
      if (this.next) this.next.removeEventListener('click', this.onNext);
      if (this.observer) this.observer.disconnect();
    }

    /* One "page" is the width of a single slide plus its gap, so a click always
       lands on a snap point rather than part way between two cards. */
    pageWidth() {
      var slide = this.track.firstElementChild;
      if (!slide) return this.track.clientWidth;
      var styles = window.getComputedStyle(this.track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return slide.getBoundingClientRect().width + gap;
    }

    scrollByPage(direction) {
      this.track.scrollBy({ left: this.pageWidth() * direction, behavior: 'smooth' });
    }

    onScroll() {
      if (!this.track) return;
      /* A one pixel tolerance: fractional scroll positions from a trackpad or a
         high-DPI display otherwise leave the end arrow permanently enabled. */
      var max = this.track.scrollWidth - this.track.clientWidth;
      var atStart = this.track.scrollLeft <= 1;
      var atEnd = this.track.scrollLeft >= max - 1;

      /* Nothing to scroll: hide the whole control rather than showing two dead
         arrows, which happens whenever the row has fewer cards than columns. */
      this.toggleAttribute('data-pdp-static', max <= 1);

      if (this.prev) this.prev.disabled = atStart;
      if (this.next) this.next.disabled = atEnd;
    }
  };

  /* ====================================================================== */
  /* C. BUY NOW                                                              */
  /* ====================================================================== */

  /* The design specifies a plain outlined BUY NOW, which Shopify's dynamic
     checkout button cannot be styled into - it renders wallet buttons whose
     markup is owned by Shopify. So this posts the current variant to
     /cart/add.js and then sends the shopper to checkout.

     Consequence worth knowing: this leaves anything already in the cart in
     place, so "buy now" checks out the whole cart, not just this product. That
     matches how Shopify's own dynamic checkout behaves for a cart that is not
     empty, so it is the less surprising of the two options. */
  var PDPBuyNow = class extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      if (!this.button) return;
      this.onClick = this.onClick.bind(this);
      this.button.addEventListener('click', this.onClick);
      this.mirrorAddToCart();
    }

    disconnectedCallback() {
      if (this.button) this.button.removeEventListener('click', this.onClick);
      if (this.availability) this.availability.disconnect();
    }

    /* Both buttons render their own disabled state from Liquid. That is right on
       first paint and wrong from the first variant change onwards: choosing a
       size re-renders the section server side, but product-info.js copies only
       named regions back into the page - price, SKU, inventory - and hands the
       add-to-cart button's disabled state to product-form.js, which owns that
       one button and nothing else. No step in that path knows this element
       exists, so BUY NOW kept whatever state the variant that happened to load
       first had.

       Selecting a sold-out size therefore left BUY NOW live beside a greyed-out
       ADD TO CART. It failed safely - cart/add.js rejects the variant and the
       shared error region says so - but only after offering a click that should
       not have been on offer.

       Mirroring the add-to-cart button rather than recomputing availability is
       deliberate: that button is the one Dawn already keeps correct, for sold
       out, for unavailable variants and for quantity rules alike. Watching it
       keeps this right without a second copy of that logic here and without a
       patch to product-form.js. */
    mirrorAddToCart() {
      var form = this.form || this.closest('form');
      this.addToCart = form ? form.querySelector('[name="add"]') : null;
      if (!this.addToCart || !window.MutationObserver) return;

      this.syncDisabled = this.syncDisabled.bind(this);
      this.availability = new MutationObserver(this.syncDisabled);
      this.availability.observe(this.addToCart, {
        attributes: true,
        attributeFilter: ['disabled'],
      });

      /* Catch the case where the two disagree before any variant change - a
         template that renders them from different conditions, say. */
      this.syncDisabled();
    }

    syncDisabled() {
      if (!this.button || !this.addToCart) return;
      this.button.disabled = this.addToCart.hasAttribute('disabled');
    }

    get form() {
      var id = this.getAttribute('data-form-id');
      return id ? document.getElementById(id) : null;
    }

    onClick(event) {
      event.preventDefault();
      var form = this.form;
      if (!form || this.button.disabled) return;

      var variantInput = form.querySelector('.product-variant-id');
      var quantityInput = form.querySelector('[name="quantity"]');
      if (!variantInput || !variantInput.value) return;

      this.button.classList.add('is-loading');
      this.button.setAttribute('aria-busy', 'true');

      var body = {
        items: [
          {
            id: Number(variantInput.value),
            quantity: quantityInput ? Number(quantityInput.value) || 1 : 1,
          },
        ],
      };

      fetch((window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(
          function (result) {
            if (!result.ok) {
              this.fail(result.data && result.data.description);
              return;
            }
            window.location.href = this.getAttribute('data-checkout-url') || '/checkout';
          }.bind(this)
        )
        .catch(
          function () {
            this.fail(null);
          }.bind(this)
        );
    }

    /* Surface the failure through the product form's existing error region so
       there is one error surface on the page, not two competing ones. */
    fail(message) {
      this.button.classList.remove('is-loading');
      this.button.removeAttribute('aria-busy');

      var wrapper = document.querySelector('.product-form__error-message-wrapper');
      var target = wrapper && wrapper.querySelector('.product-form__error-message');
      if (wrapper && target) {
        target.textContent = message || this.getAttribute('data-error') || 'Something went wrong. Please try again.';
        wrapper.hidden = false;
      }
    }
  };

  /* ====================================================================== */
  /* Registration                                                            */
  /* ====================================================================== */

  /* Guarded because product-info.js re-renders the section on variant change;
     a second definition of the same tag name throws and would stop the rest of
     this file from registering. */
  if (!customElements.get('pdp-delivery-check')) {
    customElements.define('pdp-delivery-check', PDPDeliveryCheck);
  }
  if (!customElements.get('pdp-carousel')) {
    customElements.define('pdp-carousel', PDPCarousel);
  }
  if (!customElements.get('pdp-buy-now')) {
    customElements.define('pdp-buy-now', PDPBuyNow);
  }
})();
