/* ==========================================================================
   tabi-footer.js
   Folds the footer's menu and text columns (sections/footer.liquid) into
   rows on phones. They are <details open> in the HTML, so without this file
   every column simply shows.

   Desktop keeps them open and their headings are plain headings: a click
   does nothing and they are out of the tab order. On a phone they start
   closed and the heading opens its row.
   ========================================================================== */

(() => {
  const phone = window.matchMedia('(max-width: 749px)');

  const sync = () => {
    document.querySelectorAll('[data-footer-fold]').forEach((fold) => {
      fold.open = !phone.matches;
      const summary = fold.querySelector('summary');
      if (!summary) return;
      if (phone.matches) {
        summary.removeAttribute('tabindex');
      } else {
        summary.setAttribute('tabindex', '-1');
      }
    });
  };

  document.addEventListener('click', (event) => {
    if (phone.matches) return;
    if (event.target.closest('[data-footer-fold] > summary')) event.preventDefault();
  });

  phone.addEventListener?.('change', sync);
  document.addEventListener('shopify:section:load', sync);
  sync();
})();
