/*
  Tabi currency converter - prices shown in the shopper's chosen currency.

  The store sells in INR only: Shopify Payments isn't offered in India and
  Razorpay Magic Checkout takes INR carts only. So this converts what the
  shopper SEES; the cart and checkout stay in INR, and the notice says so.

  How it works
  - Config comes from snippets/tabi-currency-head.liquid as window.tabiCurrency
    (base currency, the picker's list, decimals, notice text).
  - Rates: Shopify's daily table at /services/javascripts/currencies.js (the
    CDN copy as a fallback), read as text - never run - and cached for 6 hours.
  - Every text node holding "₹1,250.00" is rewritten in place. Each node keeps
    its original text in a WeakMap, so switching back to INR restores it and a
    node is never converted twice. A MutationObserver converts prices that
    arrive later (variant changes, search results, quick add).
  - Anything inside [data-tabi-currency-skip] is left alone (the price filter,
    whose inputs only take INR).
  - Pickers: any element with [data-tabi-currency-picker]. Its
    [data-tabi-currency-options] list is filled from the config here;
    [data-tabi-currency-label] shows the current currency ("USD $", or
    "USD ($)" with the value "paren").
  - The choice is kept in localStorage ("tabi-currency"); the head snippet reads
    it before first paint and hides <lomoney> prices until they're converted.
*/
(() => {
  const config = window.tabiCurrency;
  if (!config || window.tabiCurrencyLoaded) return;
  window.tabiCurrencyLoaded = true;

  const STORE_KEY = 'tabi-currency';
  const RATES_KEY = 'tabi-currency-rates';
  const RATES_TTL = 6 * 60 * 60 * 1000;
  const RATE_URLS = ['/services/javascripts/currencies.js', 'https://cdn.shopify.com/s/javascripts/currencies.js'];
  const SKIP = 'script, style, noscript, textarea, template, [contenteditable], [data-tabi-currency-skip]';

  // Symbols shown beside converted prices and in the picker. Codes not listed
  // here show as the code itself ("CHF 120").
  const SYMBOLS = {
    INR: '₹', USD: '$', GBP: '£', EUR: '€', SGD: 'S$', AUD: 'A$', CAD: 'C$', NZD: 'NZ$',
    HKD: 'HK$', JPY: '¥', CNY: '¥', KRW: '₩', THB: '฿', MYR: 'RM', ZAR: 'R', BDT: '৳',
    NPR: 'Rs', LKR: 'Rs', MUR: 'Rs', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  };

  const html = document.documentElement;
  const base = config.base;
  const list = Array.isArray(config.list) && config.list.length ? config.list : [base];
  const decimals = Number(config.decimals) === 2 ? 2 : 0;
  const baseSymbol = config.baseSymbol || SYMBOLS[base] || base;
  const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const priceRe = new RegExp(`${escapeRe(baseSymbol)}[\\s\\u00a0]?(\\d[\\d,]*(?:\\.\\d+)?)`, 'g');
  const numberFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  let currencyNames = null;
  try {
    currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
  } catch (error) {
    currencyNames = null;
  }

  let current = base;
  let rates = null;
  let ratesRequest = null;

  /* ---------------------------------------------------------------- storage */

  const readSaved = () => {
    try {
      return localStorage.getItem(STORE_KEY);
    } catch (error) {
      return null;
    }
  };

  const save = (code) => {
    try {
      if (code === base) localStorage.removeItem(STORE_KEY);
      else localStorage.setItem(STORE_KEY, code);
    } catch (error) {
      /* Private mode: the choice lasts for this page only. */
    }
  };

  /* ------------------------------------------------------------------ rates */

  // Both copies of the table are JavaScript, quoted ("USD":1.0) or not (USD:1).
  // Each value is what one unit of that currency is worth in US dollars.
  const parseRates = (text) => {
    const found = {};
    const re = /"?([A-Z]{3})"?\s*:\s*([0-9.eE+-]+)/g;
    let match;
    while ((match = re.exec(text))) {
      const value = parseFloat(match[2]);
      if (value > 0) found[match[1]] = value;
    }
    return found[base] ? found : null;
  };

  const readCachedRates = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(RATES_KEY));
      if (cached && Date.now() - cached.time < RATES_TTL && cached.rates && cached.rates[base]) return cached.rates;
    } catch (error) {
      /* No cache. */
    }
    return null;
  };

  const fetchRates = async () => {
    for (const url of RATE_URLS) {
      try {
        const response = await fetch(url, { credentials: 'omit' });
        if (!response.ok) continue;
        const parsed = parseRates(await response.text());
        if (!parsed) continue;
        try {
          localStorage.setItem(RATES_KEY, JSON.stringify({ time: Date.now(), rates: parsed }));
        } catch (error) {
          /* Not cached; fetched again next page. */
        }
        return parsed;
      } catch (error) {
        /* Try the next copy. */
      }
    }
    return null;
  };

  const ensureRates = () => {
    if (rates) return Promise.resolve(rates);
    const cached = readCachedRates();
    if (cached) {
      rates = cached;
      return Promise.resolve(rates);
    }
    if (!ratesRequest) {
      ratesRequest = fetchRates().then((fetched) => {
        rates = fetched;
        ratesRequest = null;
        return rates;
      });
    }
    return ratesRequest;
  };

  /* ------------------------------------------------------------- formatting */

  const symbolFor = (code) => (code === base ? baseSymbol : SYMBOLS[code] || code);

  const labelFor = (code, style) => {
    const symbol = symbolFor(code);
    if (symbol === code) return code;
    return style === 'paren' ? `${code} (${symbol})` : `${code} ${symbol}`;
  };

  const nameFor = (code) => {
    try {
      return (currencyNames && currencyNames.of(code)) || code;
    } catch (error) {
      return code;
    }
  };

  const formatPrice = (amount) => {
    const symbol = symbolFor(current);
    const gap = /^[A-Za-z]+$/.test(symbol) ? ' ' : '';
    return `${symbol}${gap}${numberFormat.format(amount)}`;
  };

  const convertText = (text) => {
    if (current === base || !rates) return text;
    const factor = rates[base] / rates[current];
    return text.replace(priceRe, (match, digits) => {
      const amount = parseFloat(digits.replace(/,/g, ''));
      return Number.isFinite(amount) ? formatPrice(amount * factor) : match;
    });
  };

  /* ------------------------------------------------------------ text nodes */

  const records = new WeakMap();
  const hasPrice = (text) => text.indexOf(baseSymbol) !== -1 && /\d/.test(text);

  const processNode = (node) => {
    const record = records.get(node);
    // If the node still shows what we wrote, its source is the saved original;
    // otherwise someone else changed it and the new text is the original.
    const original = record && node.data === record.shown ? record.original : node.data;
    if (!hasPrice(original)) {
      if (record) records.delete(node);
      return;
    }
    if (node.parentElement && node.parentElement.closest(SKIP)) return;
    const shown = convertText(original);
    records.set(node, { original, shown });
    if (node.data !== shown) node.data = shown;
  };

  const walk = (root) => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (records.has(node) || hasPrice(node.data)) processNode(node);
    }
  };

  // Our own writes come back as characterData records; processNode sees its
  // own text and leaves it, so this never loops.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') processNode(mutation.target);
      else mutation.addedNodes.forEach(walk);
    });
  });
  let observing = false;

  const observe = (on) => {
    if (on && !observing) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      observing = true;
    } else if (!on && observing) {
      observer.disconnect();
      observing = false;
    }
  };

  /* ---------------------------------------------------------------- notice */

  let notice = null;
  let noticeTimer = null;

  const buildNotice = () => {
    notice = document.createElement('div');
    notice.className = 'tabi-cc-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.innerHTML =
      '<p class="tabi-cc-notice__text"></p>' +
      '<span class="tabi-cc-notice__rule" aria-hidden="true"></span>' +
      '<button type="button" class="tabi-cc-notice__close">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" /></svg>' +
      '</button>';
    notice.querySelector('.tabi-cc-notice__close').setAttribute('aria-label', config.closeLabel || 'Close');
    notice.querySelector('.tabi-cc-notice__close').addEventListener('click', () => hideNotice());
    document.body.appendChild(notice);
  };

  const hideNotice = () => {
    clearTimeout(noticeTimer);
    if (notice) notice.classList.remove('is-visible');
  };

  const showNotice = () => {
    if (!config.showNotice || !config.notice) return;
    if (!notice) buildNotice();
    notice.querySelector('.tabi-cc-notice__text').textContent = String(config.notice)
      .split('[currency]')
      .join(current);
    // Sit just below the header while it's on screen.
    const header = document.querySelector('.section-header');
    const bottom = header ? header.getBoundingClientRect().bottom : 0;
    notice.style.top = `${Math.max(12, Math.round(bottom) + 12)}px`;
    // Restart the entrance even when a notice is already showing.
    notice.classList.remove('is-visible');
    void notice.offsetWidth;
    notice.classList.add('is-visible');
    clearTimeout(noticeTimer);
    const seconds = Number(config.noticeSeconds) || 10;
    noticeTimer = setTimeout(hideNotice, seconds * 1000);
  };

  /* --------------------------------------------------------------- pickers */

  const pickers = () => Array.from(document.querySelectorAll('[data-tabi-currency-picker]'));

  const fillOptions = (picker) => {
    picker.querySelectorAll('[data-tabi-currency-options]').forEach((container) => {
      if (container.dataset.filled) return;
      container.dataset.filled = 'true';
      const drawer = container.dataset.tabiCurrencyOptions === 'drawer';
      list.forEach((code) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.tabiCurrencyOption = code;
        if (drawer) {
          button.className = 'tabi-drawer__country';
          const name = document.createElement('span');
          name.className = 'tabi-drawer__country-name';
          name.textContent = nameFor(code);
          const tag = document.createElement('span');
          tag.className = 'tabi-drawer__country-currency';
          tag.textContent = labelFor(code);
          button.append(name, tag);
        } else {
          button.className = 'tabi-currency__option';
          button.textContent = labelFor(code);
          button.setAttribute('aria-label', nameFor(code));
        }
        item.appendChild(button);
        container.appendChild(item);
      });
    });
  };

  const refreshPickers = () => {
    pickers().forEach((picker) => {
      picker.querySelectorAll('[data-tabi-currency-label]').forEach((label) => {
        label.textContent = labelFor(current, label.dataset.tabiCurrencyLabel);
      });
      picker.querySelectorAll('[data-tabi-currency-option]').forEach((button) => {
        const code = button.dataset.tabiCurrencyOption;
        if (code === current) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
        // Hide a currency Shopify publishes no rate for (a typo in the list).
        if (rates && code !== base && !rates[code]) button.parentElement.hidden = true;
      });
    });
  };

  const setOpen = (picker, open) => {
    const toggle = picker.querySelector('[data-tabi-currency-toggle]');
    const panel = picker.querySelector('[data-tabi-currency-panel]');
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };

  const closeAll = (except) =>
    pickers().forEach((picker) => {
      if (picker !== except) setOpen(picker, false);
    });

  const choose = (code, button) => {
    const picker = button.closest('[data-tabi-currency-picker]');
    if (picker) setOpen(picker, false);
    // In the mobile menu: fold the list and close the menu, so the shopper
    // sees the new prices and the notice.
    const trigger = picker && picker.querySelector('.tabi-drawer__trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    const drawer = button.closest('tabi-drawer');
    if (code === current) return;
    ensureRates().then(() => {
      if (code !== base && !(rates && rates[code])) return;
      setCurrency(code, true);
      if (drawer && typeof drawer.close === 'function') drawer.close();
    });
  };

  const setUpPickers = () => {
    pickers().forEach((picker) => {
      // Once per element: the theme editor re-renders the header in place.
      if (picker.dataset.tabiCurrencyReady) return;
      picker.dataset.tabiCurrencyReady = 'true';
      fillOptions(picker);
      const toggle = picker.querySelector('[data-tabi-currency-toggle]');
      if (toggle) {
        toggle.addEventListener('click', () => {
          const open = toggle.getAttribute('aria-expanded') !== 'true';
          closeAll(picker);
          setOpen(picker, open);
          if (open) ensureRates().then(refreshPickers);
        });
      }
      picker.addEventListener('click', (event) => {
        const button = event.target.closest('[data-tabi-currency-option]');
        if (button) choose(button.dataset.tabiCurrencyOption, button);
      });
      picker.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !toggle || toggle.getAttribute('aria-expanded') !== 'true') return;
        event.stopPropagation();
        setOpen(picker, false);
        toggle.focus();
      });
      picker.addEventListener('focusout', (event) => {
        if (toggle && !picker.contains(event.relatedTarget)) setOpen(picker, false);
      });
    });
  };

  document.addEventListener('click', (event) => {
    pickers().forEach((picker) => {
      if (!picker.contains(event.target)) setOpen(picker, false);
    });
  });

  document.addEventListener('shopify:section:load', () => {
    setUpPickers();
    refreshPickers();
  });

  /* ------------------------------------------------------------------ apply */

  function setCurrency(requested, announce) {
    let code = requested;
    if (!list.includes(code) || (code !== base && !(rates && rates[code]))) code = base;
    current = code;
    // A failed rate download falls back to INR for this page but keeps the
    // shopper's choice for the next one.
    if (code === requested) save(code);
    walk(document.body);
    observe(code !== base);
    refreshPickers();
    html.classList.remove('tabi-cc-pending');
    if (announce && code !== base) showNotice();
    else hideNotice();
    document.dispatchEvent(new CustomEvent('tabi:currency-change', { detail: { currency: code } }));
  }

  const restoreSaved = () => {
    const saved = readSaved();
    if (!saved || saved === base || !list.includes(saved)) {
      if (current !== base) setCurrency(base, false);
      html.classList.remove('tabi-cc-pending');
      return;
    }
    if (saved === current) return;
    // Cached rates convert before the first paint; otherwise wait for them.
    const cached = rates || readCachedRates();
    if (cached && cached[saved]) {
      rates = cached;
      setCurrency(saved, false);
    } else {
      ensureRates().then(() => setCurrency(saved, false));
    }
  };

  setUpPickers();
  restoreSaved();
  refreshPickers();

  // Fetch the table ahead of the first pick, so the switch is instant and any
  // listed currency without a rate drops out of the picker.
  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1500));
  idle(() => ensureRates().then(refreshPickers));

  // Back/forward cache: the shopper may have switched on another page.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreSaved();
  });

  window.tabiCurrency.set = (code) => ensureRates().then(() => setCurrency(code, true));
})();
