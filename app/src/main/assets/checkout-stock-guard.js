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
  function guard(){
    var cart=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:null;
    if(!cart)return;
    var changed=false;
    for(var i=cart.length-1;i>=0;i--){
      var s=stockFor(cart[i]);
      if(s===null)continue;
      var q=Math.max(1,Math.floor(Number(cart[i].qty||1)));
      if(s<1){cart.splice(i,1);changed=true;continue;}
      if(q>s){cart[i].qty=s;changed=true;}
    }
    if(changed&&typeof window.saveState==='function')window.saveState();
  }
  window.mfixCheckoutStockGuard={guard,stockFor};
  setInterval(guard,1000);
  window.addEventListener('mfix:render',guard);
  guard();
})();
