(function(){
  if(window.__mfixCheckoutCartLineControlsV2)return;
  window.__mfixCheckoutCartLineControlsV2=true;
  var HOLDS_KEY='mfix_held_carts_v1';
  function money(v){return '₪'+Number(v||0).toFixed(2);}
  function stockFor(item){
    var products=window.STATE&&Array.isArray(window.STATE.products)?window.STATE.products:[];
    var id=String(item&&item.productId!=null?item.productId:'');
    var barcode=String(item&&item.barcode!=null?item.barcode:'');
    var p=products.find(function(x){
      var pid=String(x&&((x.id!=null?x.id:(x.ID!=null?x.ID:x.Id))||''));
      var pb=String(x&&((x.barcode!=null?x.barcode:(x.Barcode!=null?x.Barcode:''))||''));
      return (id&&pid===id)||(barcode&&pb===barcode);
    });
    if(!p)return null;
    var keys=['stock','Stock','quantity','Quantity','qty','Qty','inventory','Inventory'];
    for(var i=0;i<keys.length;i++){
      if(p[keys[i]]!==undefined&&p[keys[i]]!==null&&String(p[keys[i]]).trim()!==''){
        var n=Number(p[keys[i]]);
        if(Number.isFinite(n))return Math.max(0,Math.floor(n));
      }
    }
    return null;
  }
  function cartQtyExcept(index,item){
    var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];
    var key=item&&item.productId!=null&&String(item.productId)!==''?'id:'+String(item.productId):(item&&item.barcode!=null&&String(item.barcode)!==''?'barcode:'+String(item.barcode):null);
    if(!key)return 0;
    return c.reduce(function(sum,x,i){
      if(i===index)return sum;
      var k=x&&x.productId!=null&&String(x.productId)!==''?'id:'+String(x.productId):(x&&x.barcode!=null&&String(x.barcode)!==''?'barcode:'+String(x.barcode):null);
      return k===key?sum+Math.max(1,Math.floor(Number(x.qty||1))):sum;
    },0);
  }
  function allowedQty(index,item,requested){
    var stock=stockFor(item);
    if(stock===null)return Math.max(1,requested);
    var allowed=Math.max(0,stock-cartQtyExcept(index,item));
    return Math.max(0,Math.min(Math.max(1,requested),allowed));
  }
  function readHolds(){
    try{var x=JSON.parse(localStorage.getItem(HOLDS_KEY)||'[]');return Array.isArray(x)?x:[];}catch(_){return [];}
  }
  function writeHolds(items){
    try{localStorage.setItem(HOLDS_KEY,JSON.stringify(items.slice(-20)));return true;}catch(e){console.error('[MFIX HOLDS]',e);return false;}
  }
  function holdCart(){
    var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];
    if(!c.length){if(window.toast)window.toast('הסל ריק','err');return;}
    var holds=readHolds();
    var label='';
    try{label=window.prompt('שם/הערה להזמנה המושהית (אופציונלי):','')||'';}catch(_){label='';}
    holds.push({id:'hold_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),at:new Date().toISOString(),label:String(label).slice(0,80),cart:JSON.parse(JSON.stringify(c)),customerId:window.STATE.cartCustomerId||null,customerName:window.STATE.docCustomerName||'',customerPhone:window.STATE.docCustomerPhone||''});
    if(!writeHolds(holds)){if(window.toast)window.toast('לא ניתן לשמור את הסל המושהה','err');return;}
    c.splice(0,c.length);
    if(typeof window.saveState==='function')window.saveState();
    if(typeof window.render==='function')window.render();
    setTimeout(refresh,80);
    if(window.toast)window.toast('הסל הושהה ונשמר','ok');
  }
  function restoreHold(id){
    var holds=readHolds(),idx=holds.findIndex(function(x){return String(x.id)===String(id);});
    if(idx<0)return;
    var current=window.STATE.cart||[];
    if(current.length&&!window.confirm('יש כבר פריטים בסל. להחליף אותם בסל המושהה?'))return;
    var h=holds[idx];
    window.STATE.cart=Array.isArray(h.cart)?JSON.parse(JSON.stringify(h.cart)):[];
    window.STATE.cartCustomerId=h.customerId||null;
    window.STATE.docCustomerName=h.customerName||'';
    window.STATE.docCustomerPhone=h.customerPhone||'';
    holds.splice(idx,1);writeHolds(holds);
    if(typeof window.saveState==='function')window.saveState();
    if(typeof window.render==='function')window.render();
    setTimeout(refresh,80);
    if(window.toast)window.toast('הסל המושהה שוחזר','ok');
  }
  function deleteHold(id){
    var holds=readHolds(),idx=holds.findIndex(function(x){return String(x.id)===String(id);});
    if(idx<0)return;
    if(!window.confirm('למחוק את הסל המושהה?'))return;
    holds.splice(idx,1);writeHolds(holds);refresh();
    if(window.toast)window.toast('הסל המושהה נמחק','ok');
  }
  function holdsHtml(){
    var holds=readHolds();
    if(!holds.length)return '<div class="muted" style="font-size:12px;margin-top:6px">אין הזמנות מושהות</div>';
    return '<div style="margin-top:10px;border-top:1px solid var(--gray-200);padding-top:8px"><div style="font-size:12px;font-weight:800;margin-bottom:5px">📦 הזמנות מושהות ('+holds.length+')</div>'+holds.slice().reverse().map(function(h){
      var count=Array.isArray(h.cart)?h.cart.reduce(function(s,x){return s+Math.max(1,Number(x.qty||1));},0):0;
      var title=h.label||h.customerName||'הזמנה מושהית';
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 0;border-bottom:1px solid var(--gray-100)"><div style="min-width:0;flex:1"><b>'+String(title).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];})+'</b><div class="muted" style="font-size:10px">'+count+' יח׳ · '+new Date(h.at).toLocaleString('he-IL')+'</div></div><button type="button" class="btn btn-ghost" data-mfix-restore="'+String(h.id)+'">שחזר</button><button type="button" class="btn btn-ghost" data-mfix-delete-hold="'+String(h.id)+'" aria-label="מחק">✕</button></div>';
    }).join('')+'</div>';
  }
  function refresh(){
    var v=document.getElementById('view-pos');
    if(!v||!window.STATE||!Array.isArray(window.STATE.cart))return;
    var host=document.getElementById('mfixCartLineControls');
    if(!host){
      var anchor=v.querySelector('#cartTotals')||v.querySelector('.mfix-checkout-controls');
      if(!anchor)return;
      host=document.createElement('div');
      host.id='mfixCartLineControls';
      host.className='card';
      host.style.cssText='margin:0 0 10px 0;padding:10px';
      anchor.parentNode.insertBefore(host,anchor);
    }
    var cart=window.STATE.cart;
    if(!cart.length){host.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div class="muted" style="font-size:12px">הסל ריק</div><button type="button" class="btn btn-ghost" data-mfix-show-holds>📦 הזמנות מושהות</button></div>'+holdsHtml();bindHoldButtons(host);return;}
    host.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><div class="section-title" style="margin:0">🛒 פריטי הסל</div><div style="display:flex;gap:5px"><button type="button" class="btn btn-ghost" data-mfix-hold-cart>⏸️ השהה</button><button type="button" class="btn btn-ghost" data-mfix-show-holds>📦 מושהות</button><button type="button" class="btn btn-ghost" data-mfix-clear-cart aria-label="רוקן סל">🗑️ רוקן סל</button></div></div>'+cart.map(function(item,i){
      var qty=Math.max(1,Number(item.qty||1));
      var name=item.name||item.title||item.productName||'מוצר';
      var price=Number(item.price||item.unitPrice||0);
      var stock=stockFor(item);
      var stockLabel=stock===null?'':' · מלאי: '+stock;
      return '<div data-mfix-line="'+i+'" style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--gray-200);padding:7px 0">'+
        '<div style="min-width:0;flex:1"><b>'+String(name).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];})+'</b><div class="muted" style="font-size:11px">'+money(price)+' ליח׳ · '+money(price*qty)+stockLabel+'</div></div>'+ 
        '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0">'+
        '<button type="button" class="btn btn-ghost" data-mfix-qty="'+i+'" data-dir="-1" aria-label="הפחת כמות">−</button>'+ 
        '<input type="number" min="1" step="1" inputmode="numeric" value="'+qty+'" data-mfix-qty-input="'+i+'" aria-label="כמות" style="width:58px;padding:8px 5px;text-align:center;border:1px solid var(--gray-300);border-radius:8px;font-weight:700">'+
        '<button type="button" class="btn btn-ghost" data-mfix-qty="'+i+'" data-dir="1" aria-label="הגדל כמות">+</button>'+ 
        '<button type="button" class="btn btn-ghost" data-mfix-remove="'+i+'" aria-label="הסר">✕</button>'+ 
        '</div></div>';
    }).join('')+holdsHtml();
    host.querySelectorAll('[data-mfix-qty]').forEach(function(btn){btn.onclick=function(){var i=Number(btn.dataset.mfixQty),d=Number(btn.dataset.dir),c=window.STATE.cart;if(!c[i])return;var current=Math.max(1,Math.floor(Number(c[i].qty||1)));var requested=current+d;if(requested<1){c.splice(i,1);persist();return}var allowed=allowedQty(i,c[i],requested);if(allowed<requested){if(window.toast)window.toast('לא ניתן לעבור את המלאי הזמין','err');return}c[i].qty=allowed;persist();};});
    host.querySelectorAll('[data-mfix-qty-input]').forEach(function(input){
      input.addEventListener('change',function(){
        var i=Number(input.dataset.mfixQtyInput),c=window.STATE.cart;if(!c[i])return;
        var q=Math.floor(Number(input.value));
        if(!Number.isFinite(q)||q<1){input.value=Math.max(1,Number(c[i].qty||1));if(window.toast)window.toast('הכמות חייבת להיות לפחות 1','err');return;}
        var allowed=allowedQty(i,c[i],q);if(allowed<q){input.value=Math.max(1,Number(c[i].qty||1));if(window.toast)window.toast('הכמות שביקשת גבוהה מהמלאי הזמין','err');return;}
        c[i].qty=q;persist();
      });
      input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();input.blur();}});
    });
    host.querySelectorAll('[data-mfix-remove]').forEach(function(btn){btn.onclick=function(){var i=Number(btn.dataset.mfixRemove),c=window.STATE.cart;if(!c[i])return;if(!window.confirm('להסיר את המוצר מהסל?'))return;c.splice(i,1);persist();};});
    var clear=host.querySelector('[data-mfix-clear-cart]');
    if(clear)clear.onclick=function(){var c=window.STATE.cart;if(!c.length)return;if(!window.confirm('לרוקן את כל הסל?'))return;c.splice(0,c.length);persist('הסל רוקן');};
    bindHoldButtons(host);
  }
  function bindHoldButtons(host){
    var hold=host.querySelector('[data-mfix-hold-cart]');if(hold)hold.onclick=holdCart;
    var show=host.querySelector('[data-mfix-show-holds]');if(show)show.onclick=function(){var el=host.querySelector('[data-mfix-holds-panel]');if(el){el.remove();return;}var panel=document.createElement('div');panel.dataset.mfixHoldsPanel='1';panel.innerHTML=holdsHtml();host.appendChild(panel);bindHoldButtons(panel);};
    host.querySelectorAll('[data-mfix-restore]').forEach(function(b){b.onclick=function(){restoreHold(b.dataset.mfixRestore);};});
    host.querySelectorAll('[data-mfix-delete-hold]').forEach(function(b){b.onclick=function(){deleteHold(b.dataset.mfixDeleteHold);};});
  }
  function persist(message){
    try{if(typeof window.saveState==='function')window.saveState();else localStorage.setItem('mfix_state',JSON.stringify(window.STATE));}catch(e){console.error('[MFIX CART CONTROLS]',e);}
    if(typeof window.render==='function')window.render();
    setTimeout(refresh,80);
    if(window.toast)window.toast(message||'הסל עודכן','ok');
  }
  var tries=0;
  function install(){refresh();tries++;if(tries<80)setTimeout(install,500);}
  install();
  window.addEventListener('mfix:render',function(){setTimeout(refresh,50);});
  window.addEventListener('storage',function(e){if(e.key===HOLDS_KEY)setTimeout(refresh,50);});
  console.log('[MFIX] cart quantity/remove/clear + held carts active');
})();
