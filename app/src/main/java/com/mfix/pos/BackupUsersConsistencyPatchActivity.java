package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Keeps the active user stores mirrored into the legacy backup slot used by export/restore. */
public class BackupUsersConsistencyPatchActivity extends KeyboardShortcutPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixBackupUsersConsistency)return;window.__mfixBackupUsersConsistency=true;"+
        "var TARGET='mfix_users_v1',SOURCES=['mfix_pos_users_v1','mfix_users_v2'];"+
        "function sync(){try{var best=null;for(var i=0;i<SOURCES.length;i++){var v=localStorage.getItem(SOURCES[i]);if(v){try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length){best=v;break;}}catch(e){}}}if(best)localStorage.setItem(TARGET,best);}catch(e){console.error('[MFIX BACKUP USERS]',e);}}"+
        "function restoreMirror(){try{var v=localStorage.getItem(TARGET);if(!v)return;for(var i=0;i<SOURCES.length;i++){try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length)localStorage.setItem(SOURCES[i],v);}catch(e){}}}catch(e){}}"+
        "restoreMirror();sync();setInterval(sync,1500);console.log('[MFIX] backup user-store consistency active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),16000);
    }
}
