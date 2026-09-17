package com.mfix.pos;

import android.webkit.WebView;
import java.lang.reflect.Field;

/** Installs the existing backup/restore runtime patch into the live launcher without duplicating its JS. */
public final class BackupRestoreLiveInstaller {
    private BackupRestoreLiveInstaller() {}

    public static void install(WebView webView) {
        if (webView == null) return;
        try {
            Field field = BackupRestorePatchActivity.class.getDeclaredField("PATCH");
            field.setAccessible(true);
            Object value = field.get(null);
            if (value instanceof String) {
                String patch = (String) value;
                webView.postDelayed(() -> webView.evaluateJavascript(patch, null), 1800);
            }
        } catch (Exception e) {
            android.util.Log.e("MFIX", "Backup/restore activation failed", e);
        }
    }
}
