package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates the existing inventory management patch while preserving the live settings chain. */
public class InventoryManagementActivePatchActivity extends InventoryManagementPatchActivity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(
                "console.log('[MFIX] inventory management active');", null), 150);
        }
    }
}
