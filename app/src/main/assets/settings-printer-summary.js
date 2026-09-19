/* MFIX Settings: printer configuration summary (non-destructive). */
(function(){
  'use strict';
  const mount = function(){
    const view = document.getElementById('view-settings');
    if(!view || view.querySelector('[data-mfix-printer-summary]')) return;
    const settings = (typeof STATE !== 'undefined' && STATE && STATE.settings) ? STATE.settings : {};
    const printer = settings.printer || {};
    const defaultPrinter = settings.printerDefault || settings.defaultPrinter || null;
    const paper = settings.printerPaperMode || printer.paperMode || '80mm';
    const autoDrawer = !!(settings.printerAutoDrawer || printer.autoDrawer);
    const autoPrint = !!(settings.printerAutoPrint || printer.autoPrint);
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.mfixPrinterSummary = '1';
    card.style.marginTop = '12px';
    card.innerHTML = '<div class="section-title">🖨️ מצב הגדרות הדפסה</div>' +
      '<div class="grid2" style="margin-bottom:10px">' +
      '<div><div class="muted" style="font-size:12px">מדפסת ברירת מחדל</div><strong>' + escapeHtml(defaultPrinter && (defaultPrinter.name || defaultPrinter.label || defaultPrinter.id) || 'לא נבחרה') + '</strong></div>' +
      '<div><div class="muted" style="font-size:12px">רוחב נייר</div><strong>' + escapeHtml(String(paper)) + '</strong></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<span class="pill ' + (autoPrint ? 'green' : 'gray') + '">הדפסה אוטומטית: ' + (autoPrint ? 'פעילה' : 'כבויה') + '</span>' +
      '<span class="pill ' + (autoDrawer ? 'green' : 'gray') + '">מגירה: ' + (autoDrawer ? 'אוטומטית' : 'ידנית') + '</span>' +
      '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:10px">הכרטיס מציג את ההגדרות הקיימות בלבד ואינו משנה אותן.</div>';
    view.appendChild(card);
  };
  const escapeHtml = function(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  };
  const watch = function(){
    try{ mount(); }catch(_){ }
    setTimeout(function(){ try{ mount(); }catch(_){} }, 250);
  };
  document.addEventListener('click', function(e){
    const tab = e.target && e.target.closest ? e.target.closest('[data-tab="settings"], [data-view="settings"], .navtab') : null;
    if(tab) setTimeout(watch, 30);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  setInterval(function(){
    const view = document.getElementById('view-settings');
    if(view && view.classList.contains('active')) mount();
  }, 1500);
})();
