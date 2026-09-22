(function(){
  if(window.__mfixCheckoutStockGuard)return;
  window.__mfixCheckoutStockGuard=true;
  function products(){return window.STATE&&Array.isArray(window.STATE.products)?window.STATE.products:[];}
  function productFor(item){
    var list=products();
    var id=String(item&&item.productId!=null?item.productId:'');
    var barcode=String(item&&item.barcode!=null?item.barcode:'');
    return list.find(function(x){
      var pid=String(x&&((x.id!=null?x.id:(x.ID!=null?x.ID:x.Id))||''));
      var pb=String(x&&((x.barcode!=null?x.barcode:(x.Barcode!=null?x.Barcode:''))||''));
      return (id&&pid===id)||(barcode&&pb===barcode);
    })||null;
  }
  function stockFor(item){
    var p=productFor(item);
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
  function itemKey(item){
    var p=productFor(item);
    if(p){
      var pid=p.id!=null?p.id:(p.ID!=null?p.ID:p.Id);
      if(pid!=null&&String(pid)!=='')return 'id:'+String(pid);
      var pb=p.barcode!=null?p.barcode:(p.Barcode!=null?p.Barcode:'');
      if(String(pb)!=='')return 'barcode:'+String(pb);
    }
    if(item&&item.productId!=null&&String(item.productId)!=='')return 'id:'+String(item.productId);
    if(item&&item.barcode!=null&&String(item.barcode)!=='')return 'barcode:'+String(item.barcode);
    return null;
  }
  function cartIssues(){
    var cart=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:null;
    if(!cart)return [];
    var totals={};
    var issues=[];
    for(var i=0;i<cart.length;i++){
      var key=itemKey(cart[i]);
      if(!key)continue;
      var q=Math.max(1,Math.floor(Number(cart[i].qty||1)));
      totals[key]=(totals[key]||0)+q;
    }
    for(var j=0;j<cart.length;j++){
      var item=cart[j],key=itemKey(item),s=stockFor(item);
      if(s===null||!key)continue;
      var q=Math.max(1,Math.floor(Number(item.qty||1))),requested=totals[key]||q;
      if(s<requested){
        issues.push({item:item,available:s,requested:requested});
      }
    }
    return issues;
  }
  function notify(text){
    if(typeof window.toast==='function')window.toast(text,3500);
    else if(typeof window.alert==='function')window.alert(text);
  }
  function validate(options){
    var issues=cartIssues();
    if(issues.length){
      var first=issues[0],name=String(first.item&&((first.item.name||first.item.Name||first.item.productName)||'המוצר')).trim();
      var message='⚠️ אין מספיק מלאי עבור '+name+' — זמין '+first.available+', בעגלה '+first.requested+'. יש לעדכן את הכמות לפני התשלום.';
      if(options&&options.notify!==false)notify(message);
      return false;
    }
    return true;
  }
  function guard(){
    // Do not silently delete or reduce cart lines. Stock validation belongs at checkout,
    // while the cart must remain editable so the cashier can decide what to remove.
    if(typeof window.saveState==='function'&&window.STATE&&window.STATE.cart)window.STATE.cart;
  }
  function checkoutButton(el){
    var t=String(el&&el.innerText||el&&el.value||'').trim();
    return /תשלום|סיום|מכירה|חשבונית|checkout|pay/i.test(t);
  }
  function installCheckoutGuard(){
    if(window.__mfixCheckoutGuardClicks)return;
    window.__mfixCheckoutGuardClicks=true;
    document.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]'):null;
      if(!el||!checkoutButton(el))return;
      if(!validate()){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);
  }
  window.mfixCheckoutStockGuard={guard:guard,stockFor:stockFor,validate:validate,cartIssues:cartIssues};
  installCheckoutGuard();
  setInterval(guard,2000);
  window.addEventListener('mfix:render',guard);
  guard();
})();
