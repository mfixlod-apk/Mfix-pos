/* MFIX Settings: editable store/receipt defaults with persistence fallback. */
(function(){
  'use strict';

  const KEY = 'cp_settings';
  const getState = () => (typeof STATE !== 'undefined' && STATE) ? STATE : null;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const settings = () => {
    const s = getState();
    if(!s) return {};
    if(!s.settings || typeof s.settings !== 'object') s.settings = {};
    return s.settings;
  };

  async function persist(){
    const value = JSON.stringify(settings());
    try{
      if(window.storage && typeof window.storage.set === 'function'){
        await window.storage.set(KEY, value);
        return true;
      }
    }catch(_){ }
    try{
      localStorage.setItem(KEY, value);
      return true;
    }catch(_){ return false; }
  }

  function render(){
    const view = document.getElementById('view-settings');
    if(!view || view.querySelector('[data-mfix-general-settings]')) return;
    const s = settings();
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.mfixGeneralSettings = '1';
    card.style.marginTop = '12px';
    card.innerHTML = `
      <div class="section-title">⚙️ הגדרות כלליות של העסק</div>
      <div class="muted" style="font-size:12px;margin-bottom:12px">פרטי העסק והטקסט שיוכלו לשמש במסמכי הקופה ובהדפסה.</div>
      <div class="grid2">
        <div class="field"><label class="flabel">שם העסק</label><input class="input" data-mfix-setting="businessName" value="${esc(s.businessName || s.storeName || '')}" placeholder="Mfix"></div>
        <div class="field"><label class="flabel">טלפון העסק</label><input class="input" data-mfix-setting="businessPhone" value="${esc(s.businessPhone || s.phone || '')}" placeholder="050-0000000"></div>
      </div>
      <div class="field"><label class="flabel">כתובת העסק</label><input class="input" data-mfix-setting="businessAddress" value="${esc(s.businessAddress || s.address || '')}" placeholder="כתובת החנות"></div>
      <div class="field"><label class="flabel">שורת תחתית למסמך</label><textarea class="input" rows="2" data-mfix-setting="receiptFooter" placeholder="תודה שקניתם ב-Mfix">${esc(s.receiptFooter || '')}</textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-start;flex-wrap:wrap">
        <button class="btn btn-primary" type="button" data-mfix-save-settings>💾 שמור הגדרות</button>
        <button class="btn btn-ghost" type="button" data-mfix-reset-settings>↩️ בטל שינויים</button>
      </div>`;

    card.addEventListener('click', async (e) => {
      if(e.target.closest('[data-mfix-save-settings]')){
        card.querySelectorAll('[data-mfix-setting]').forEach(input => {
          const key = input.dataset.mfixSetting;
          settings()[key] = input.value;
        });
        const ok = await persist();
        try{ if(typeof toast === 'function') toast(ok ? 'ההגדרות נשמרו' : 'ההגדרות עודכנו אך לא ניתן היה לשמור', ok ? 'ok' : 'err'); }catch(_){ }
        return;
      }
      if(e.target.closest('[data-mfix-reset-settings]')){
        // Rebuild the card from the persisted/current STATE values so unsaved
        // edits are actually discarded instead of leaving the edited inputs on screen.
        mount();
      }
    });
    view.appendChild(card);
  }

  function mount(){
    const view = document.getElementById('view-settings');
    if(!view) return;
    const existing = view.querySelector('[data-mfix-general-settings]');
    if(existing) existing.remove();
    render();
  }

  document.addEventListener('click', (e) => {
    const tab = e.target && e.target.closest ? e.target.closest('[data-tab="settings"], [data-view="settings"], .navtab') : null;
    if(tab) setTimeout(mount, 40);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setInterval(() => {
    const view = document.getElementById('view-settings');
    if(view && view.classList.contains('active')) render();
  }, 1800);
})();
