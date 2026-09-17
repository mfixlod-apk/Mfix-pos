package com.mfix.pos;

import android.webkit.WebView;

/** Adds a local safety snapshot before destructive restore and a rollback action for the last restore. */
public final class BackupRestoreSafetyPatchActivity {
    private BackupRestoreSafetyPatchActivity() {}

    private static final String PATCH =
        "(function(){if(window.__mfixBackupSafetyV2)return;window.__mfixBackupSafetyV2=true;"+
        "var SNAP='mfix_pre_restore_snapshot_v2';"+
        "function saveSnapshot(){try{if(!window.STATE)return false;var s={version:2,createdAt:new Date().toISOString(),state:window.STATE,usersV1:localStorage.getItem('mfix_users_v1'),usersV2:localStorage.getItem('mfix_users_v2'),activeUser:localStorage.getItem('mfix_pos_active_user_v1'),yeshInvoice:localStorage.getItem('mfix_yesh_invoice_v1'),yeshInvoiceOutbox:localStorage.getItem('mfix_yesh_invoice_outbox_v1')};localStorage.setItem(SNAP,JSON.stringify(s));return true;}catch(e){console.error('[MFIX BACKUP SAFETY]',e);return false;}}"+
        "async function rollback(){try{var raw=localStorage.getItem(SNAP);if(!raw){toast('אין נקודת שחזור מקומית','err');return;}var s=JSON.parse(raw),st=s.state;if(!st||typeof st!=='object')throw new Error('snapshot invalid');if(!confirm('לשחזר את הנתונים שנשמרו לפני השחזור האחרון?'))return;if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת הנתונים אינו זמין');var misc={returns:Array.isArray(st.returns)?st.returns:[],shifts:Array.isArray(st.shifts)?st.shifts:[],giftCards:Array.isArray(st.giftCards)?st.giftCards:[],preorders:Array.isArray(st.preorders)?st.preorders:[],auditLog:Array.isArray(st.auditLog)?st.auditLog:[],inventoryHistory:Array.isArray(st.inventoryHistory)?st.inventoryHistory:[],currentShift:st.currentShift||null};await window.saveKey('settings',st.settings||{});await window.saveKey('products',Array.isArray(st.products)?st.products:[]);await window.saveKey('customers',Array.isArray(st.customers)?st.customers:[]);await window.saveKey('sales',Array.isArray(st.sales)?st.sales:[]);await window.saveKey('repairs',Array.isArray(st.repairs)?st.repairs:[]);await window.saveKey('misc',misc);if(s.usersV1!=null)localStorage.setItem('mfix_users_v1',s.usersV1);if(s.usersV2!=null)localStorage.setItem('mfix_users_v2',s.usersV2);if(s.activeUser!=null)localStorage.setItem('mfix_pos_active_user_v1',s.activeUser);if(s.yeshInvoice!=null)localStorage.setItem('mfix_yesh_invoice_v1',s.yeshInvoice);if(s.yeshInvoiceOutbox!=null)localStorage.setItem('mfix_yesh_invoice_outbox_v1',s.yeshInvoiceOutbox);toast('השחזור האחרון בוטל והנתונים הוחזרו','ok');setTimeout(function(){location.reload();},500);}catch(e){console.error('[MFIX BACKUP ROLLBACK]',e);toast('ביטול השחזור נכשל: '+(e&&e.message?e.message:'שגיאה'),'err');}}"+
        "function hook(){if(typeof window.mfixRestoreBackup!=='function'){setTimeout(hook,250);return;}if(!window.__mfixRestoreWrapped){var old=window.mfixRestoreBackup;window.mfixRestoreBackup=function(){if(!saveSnapshot()){toast('לא ניתן ליצור נקודת שחזור בטוחה','err');return;}return old.apply(this,arguments);};window.__mfixRestoreWrapped=true;}var host=document.querySelector('.topbar-right');if(host&&!document.getElementById('mfixRollbackButton')&&localStorage.getItem(SNAP)){var b=document.createElement('button');b.id='mfixRollbackButton';b.className='btn btn-outline';b.textContent='↩ ביטול שחזור';b.title='שחזור נקודת הבטיחות שלפני השחזור האחרון';b.onclick=rollback;host.appendChild(b);}}hook();setInterval(hook,1000);console.log('[MFIX] restore safety snapshot v2 active');})();";

    public static void install(WebView webView){
        if(webView!=null)webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),3000);
    }
}
