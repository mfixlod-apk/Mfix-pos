(function(){
  if(window.__mfixCheckoutStockGuard)return;
  window.__mfixCheckoutStockGuard=true;
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
  function itemKey(item){
    if(item&&item.productId!=null&&String(item.productId)!=='')return 'id:'+String(item.productId);
    if(item&&item.barcode!=null&&String(item.barcode)!=='')return 'barcode:'+String(item.barcode);
    return null;
  }
  function guard(){
    var cart=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:null;
    if(!cart)return;
    var totals={};
    var changed=false;
    for(var i=0;i<cart.length;i++){
      var key=itemKey(cart[i]);
      if(!key)continue;
      var q=Math.max(1,Math.floor(Number(cart[i].qty||1)));
      totals[key]=(totals[key]||0)+q;
    }
    for(var j=cart.length-1;j>=0;j--){
      var key=itemKey(cart[j]);
      var s=stockFor(cart[j]);
      if(s===null||!key)continue;
      var q=Math.max(1,Math.floor(Number(cart[j].qty||1)));
      if(s<1){
        cart.splice(j,1);
        totals[key]=Math.max(0,(totals[key]||0)-q);
        changed=true;
        continue;
      }
      var excess=Math.max(0,(totals[key]||0)-s);
      if(excess>0){
        var allowed=Math.max(0,q-excess);
        if(allowed<1){
          cart.splice(j,1);
          totals[key]=Math.max(0,(totals[key]||0)-q);
        }else{
          cart[j].qty=allowed;
          totals[key]-=(q-allowed);
        }
        changed=true;
      }
    }
    if(changed&&typeof window.saveState==='function')window.saveState();
  }
  window.mfixCheckoutStockGuard={guard,stockFor};
  setInterval(guard,1000);
  window.addEventListener('mfix:render',guard);
  guard();
})();
