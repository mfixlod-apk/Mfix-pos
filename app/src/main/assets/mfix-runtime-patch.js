/* MFIX runtime patch: post-checkout automatic printer dispatch.
 * Kept outside index.html so the Android shell can update this behavior without
 * duplicating the large single-file POS source. The patch only prints a sale
 * that was created by the checkout operation itself.
 */
(function(){
  'use strict';
  if (window.__MFIX_AUTO_PRINT_PATCH__) return;
  window.__MFIX_AUTO_PRINT_PATCH__ = true;

  function getSettings(){
    try { return window.STATE && window.STATE.settings ? window.STATE.settings : null; }
    catch (_) { return null; }
  }

  function scheduleSalePrint(sale){
    var s = getSettings();
    if (!s || s.printerAutoPrint === false || !sale || !sale.id) return;
    // Give persistence/rendering a chance to settle before dispatching the
    // same printDoc() path used by the explicit Print button.
    setTimeout(function(){
      try {
        if (typeof window.printDoc === 'function') {
          window.printDoc(sale.id);
        }
      } catch (e) {
        console.error('[MFIX AUTO PRINT PATCH]', e);
      }
    }, 120);
  }

  function install(){
    if (typeof window.finalizeSale !== 'function') {
      setTimeout(install, 100);
      return;
    }
    if (window.finalizeSale.__mfixAutoPrintWrapped__) return;

    var original = window.finalizeSale;
    async function wrappedFinalizeSale(){
      var before = (window.STATE && Array.isArray(window.STATE.sales)) ? window.STATE.sales.length : 0;
      var result = await original.apply(this, arguments);
      try {
        var sales = window.STATE && Array.isArray(window.STATE.sales) ? window.STATE.sales : [];
        if (sales.length > before) {
          scheduleSalePrint(sales[sales.length - 1]);
        }
      } catch (e) {
        console.error('[MFIX AUTO PRINT CAPTURE]', e);
      }
      return result;
    }
    wrappedFinalizeSale.__mfixAutoPrintWrapped__ = true;
    wrappedFinalizeSale.__mfixOriginal__ = original;
    window.finalizeSale = wrappedFinalizeSale;
  }

  install();
})();
