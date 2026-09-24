/* MFIX user PIN lock.
 * Adds optional per-user PIN protection to the existing local user switcher.
 * PINs are stored as SHA-256 digests in localStorage; this is application-level
 * protection on a single device, not a secure identity/authentication system.
 */
(function(){
  'use strict';
  const KEY='mfix_users_permissions_v1';
  const PIN_KEY='mfix_user_pin_hashes_v1';
  const normalizePin=v=>String(v??'').trim();
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
  const readPins=()=>{try{const v=JSON.parse(localStorage.getItem(PIN_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}};
  const writePins=v=>{try{localStorage.setItem(PIN_KEY,JSON.stringify(v));return true}catch(_){return false}};
  const toast=(m,k)=>typeof window.toast==='function'?window.toast(m,k):alert(m);
  async function digest(pin){
    const bytes=new TextEncoder().encode(pin);
    if(window.crypto?.subtle){
      const buf=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
    }
    let h=2166136261; for(const b of bytes){h^=b;h=Math.imul(h,16777619)}
    return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0');
  }
  async function setPin(id){
    const data=load(); const u=data?.users?.find(x=>x.id===id); if(!u)return;
    const pin=normalizePin(prompt(`PIN עבור ${u.name}:`,''));
    if(!pin){toast('הגדרת PIN בוטלה','err');return}
    if(!/^\d{4,8}$/.test(pin)){toast('ה-PIN חייב להכיל 4 עד 8 ספרות','err');return}
    const confirmPin=normalizePin(prompt('הקלד שוב את ה-PIN:',''));
    if(pin!==confirmPin){toast('ה-PIN אינו תואם','err');return}
    const pins=readPins();pins[id]=await digest(pin);
    if(!writePins(pins)){toast('שמירת ה-PIN נכשלה','err');return}
    toast('ה-PIN נשמר ✓','ok');
  }
  function clearPin(id){
    const data=load(); const u=data?.users?.find(x=>x.id===id); if(!u)return;
    const pins=readPins();if(!pins[id]){toast('למשתמש אין PIN','err');return}
    if(!confirm(`להסיר את ה-PIN של ${u.name}?`))return;
    delete pins[id];writePins(pins);toast('ה-PIN הוסר ✓','ok');
  }
  async function verify(id){
    const pins=readPins(), expected=pins[id];
    if(!expected)return true;
    for(let attempt=1;attempt<=3;attempt++){
      const pin=normalizePin(prompt('הזן PIN למעבר משתמש:',''));
      if(!pin)return false;
      if(await digest(pin)===expected)return true;
      if(attempt<3)toast(`PIN שגוי — ניסיון ${attempt} מתוך 3`,'err');
    }
    toast('מעבר המשתמש בוטל לאחר 3 ניסיונות שגויים','err');return false;
  }
  function addButtons(){
    const dialog=document.getElementById('modalOverlay');
    if(!dialog)return;
    const rows=dialog.querySelectorAll('tbody tr');
    rows.forEach(row=>{
      if(row.querySelector('[data-mfix-pin]'))return;
      const name=(row.children[0]?.textContent||'').trim();
      const data=load();const u=data?.users?.find(x=>x.name===name);if(!u)return;
      const cell=row.lastElementChild;if(!cell)return;
      const b=document.createElement('button');b.className='btn btn-ghost';b.dataset.mfixPin='1';b.textContent=readPins()[u.id]?'🔑 PIN':'🔓 הגדר PIN';
      b.onclick=()=>setPin(u.id);cell.appendChild(b);
      if(readPins()[u.id]){const c=document.createElement('button');c.className='btn btn-ghost';c.dataset.mfixPinClear='1';c.textContent='הסר PIN';c.onclick=()=>clearPin(u.id);cell.appendChild(c)}
    });
  }
  function install(){
    if(!window.MFIXUsers||window.MFIXUsers.__pinLock)return false;
    const original=window.MFIXUsers.setCurrent;
    window.MFIXUsers.setCurrent=async function(){
      const id=document.getElementById('mfixActiveUser')?.value;if(!id)return;
      if(!await verify(id))return;
      return original();
    };
    window.MFIXUsers.setPin=setPin;window.MFIXUsers.clearPin=clearPin;window.MFIXUsers.verifyPin=verify;window.MFIXUsers.__pinLock=true;
    addButtons();return true;
  }
  if(install())return;
  let tries=0;const timer=setInterval(()=>{addButtons();if(install()||++tries>=60)clearInterval(timer)},400);
  new MutationObserver(addButtons).observe(document.documentElement,{childList:true,subtree:true});
})();
