package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a local safety snapshot before restore and allows recovery from the latest snapshot. */
public class SafetyBackupPatchActivity extends YeshInvoicePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixSafetyBackupV1)return;window.__mfixSafetyBackupV1=true;"+
        "var KEY='mfix_pos_safety_backup_v1';"+
        "function summary(s){return 'מוצרים: '+(Array.isArray(s.products)?s.products.length:0)+' | לקוחות: '+(Array.isArray(s.customers)?s.customers.length:0)+' | מכירות: '+(Array.isArray(s.sales)?s.sales.length:0)+' | תיקונים: '+(Array.isArray(s.repairs)?s.repairs.length:0);}"+
        "function makeSnapshot(){try{if(!window.STATE)return null;return {format:'MFIX_POS_SAFETY_BACKUP',version:1,createdAt:new Date().toISOString(),summary:summary(window.STATE),state:JSON.parse(JSON.stringify(window.STATE)),users:localStorage.getItem('mfix_pos_users_v1'),activeUser:localStorage.getItem('mfix_pos_active_user_v1'),yeshInvoice:localStorage.getItem('mfix_yesh_invoice_v1'),yeshInvoiceOutbox:localStorage.getItem('mfix_yesh_invoice_outbox_v1')};}catch(e){console.error('[MFIX SAFETY]',e);return null;}}"+
        "function saveSnapshot(){var s=makeSnapshot();if(!s)return false;try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch(e){console.error('[MFIX SAFETY SAVE]',e);return false;}}"+
        "function b64(s){try{var bytes=new TextEncoder().encode(s),bin='';for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);return btoa(bin);}catch(e){return '';}}"+
        "function install(){if(typeof window.mfixReceiveNativeBackup!=='function'){setTimeout(install,250);return;}if(window.mfixReceiveNativeBackup.__mfixSafetyWrapped)return;var original=window.mfixReceiveNativeBackup;var wrapped=function(b64data){if(window.__mfixRestoringSafety)return original(b64data);if(!saveSnapshot()){if(!confirm('לא ניתן ליצור גיבוי בטיחותי לפני השחזור. להמשיך בכל זאת?'))return;}return original(b64data);};wrapped.__mfixSafetyWrapped=true;window.mfixReceiveNativeBackup=wrapped;"+
        "window.mfixRestoreSafetyBackup=function(){var raw=null;try{raw=localStorage.getItem(KEY);}catch(e){}if(!raw){toast('אין גיבוי בטיחותי זמין','err');return;}try{var s=JSON.parse(raw),when=s.createdAt?new Date(s.createdAt).toLocaleString('he-IL'):'לא ידוע';if(!confirm('שחזור גיבוי בטיחותי מתאריך '+when+' יחליף את הנתונים הנוכחיים. להמשיך?'))return;window.__mfixRestoringSafety=true;original(b64(JSON.stringify(s)));setTimeout(function(){window.__mfixRestoringSafety=false;},1000);}catch(e){toast('הגיבוי הבטיחותי אינו תקין','err');}};"+
        "function decorate(){var modal=document.getElementById('mfixBackupButton');if(!modal)return;var old=window.mfixOpenBackupRestore;if(typeof old!=='function'||old.__mfixSafetyDecorated)return;window.mfixOpenBackupRestore=function(){old();setTimeout(function(){var body=document.querySelector('.modal-body');if(!body||body.querySelector('.mfixSafetyRestore'))return;var card=document.createElement('div');card.className='card mfixSafetyRestore';card.style.marginTop='12px';card.innerHTML='<b>🛡️ גיבוי בטיחותי</b><div class=\"muted\">לפני כל שחזור נשמר עותק מקומי של הנתונים הקיימים. ניתן לחזור לעותק האחרון.</div><button class=\"btn btn-outline\" style=\"margin-top:10px\" onclick=\"mfixRestoreSafetyBackup()\">שחזר את העותק האחרון</button>';body.appendChild(card);},50);};window.mfixOpenBackupRestore.__mfixSafetyDecorated=true;}"+
        "decorate();setInterval(decorate,1000);console.log('[MFIX] safety backup patch active');}"+
        "install();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3200);
    }
}
