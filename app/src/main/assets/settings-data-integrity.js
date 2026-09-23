/* MFIX settings data-integrity summary. Read-only diagnostics; never mutates application data. */
(function(){
  'use strict';
  const ID='mfix-settings-data-integrity-v1';
  function getState(){return window.STATE&&typeof window.STATE==='object'?window.STATE:null;}
  function render(){
    const state=getState();
    const active=document.querySelector('.view.active');
    if(!state||!active||!/(הגדרות|settings)/i.test(active.innerText||'')) return;
    let box=document.getElementById(ID);
    if(!box){
      box=document.createElement('div');box.id=ID;box.style.cssText='margin-top:12px;padding:12px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;direction:rtl';
      active.appendChild(box);
    }
    const products=Array.isArray(state.products)?state.products:[];
    const cart=Array.isArray(state.cart)?state.cart:[];
    const printers=Array.isArray(state.settings?.printers)?state.settings.printers:[];
    const invalidProducts=products.filter(p=>!p||!String(p.name??p.Name??'').trim()).length;
    const duplicateIds=new Set();const seen=new Set();
    products.forEach(p=>{const id=String(p?.id??p?.sku??p?.CatalogNumber??'').trim();if(!id)return;if(seen.has(id))duplicateIds.add(id);else seen.add(id);});
    box.innerHTML='<div style="font-weight:900;margin-bottom:7px">🔎 בדיקת תקינות נתוני MFIX</div><div style="font-size:12px;line-height:1.8">מוצרים: '+products.length+' · שורות בקופה: '+cart.length+' · מדפסות מוגדרות: '+printers.length+'<br>מוצרים ללא שם: '+invalidProducts+' · מזהי מוצרים כפולים: '+duplicateIds.size+'</div><div style="margin-top:7px;font-size:11px;color:#667085">בדיקה לקריאה בלבד — לא משנה נתונים.</div>';
  }
  setInterval(render,1200);
})();
