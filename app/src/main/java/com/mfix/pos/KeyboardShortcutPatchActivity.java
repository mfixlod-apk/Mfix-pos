package com.mfix.pos;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;

/** Adds the physical-keyboard Ctrl+Alt+F shortcut to restart the MFIX app cleanly. */
public class KeyboardShortcutPatchActivity extends CheckoutControlsPatchActivity {
    private boolean restarting;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null && event.getAction() == KeyEvent.ACTION_DOWN
                && event.getKeyCode() == KeyEvent.KEYCODE_F
                && event.isCtrlPressed() && event.isAltPressed()) {
            if (!restarting) restartMfix();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void restartMfix() {
        restarting = true;
        try {
            Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launch == null) {
                restarting = false;
                return;
            }
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    startActivity(launch);
                    finishAndRemoveTask();
                } catch (Exception e) {
                    restarting = false;
                }
            }, 120);
        } catch (Exception e) {
            restarting = false;
        }
    }
}
