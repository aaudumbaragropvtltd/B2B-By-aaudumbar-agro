package site.b2bindia.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

/**
 * WebAppInterface
 * JavaScript bridge injected into window.AndroidBridge for native Android integration.
 */
public class WebAppInterface {

    private final Context mContext;

    public WebAppInterface(Context context) {
        this.mContext = context;
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public String getAppVersion() {
        return "1.0.0";
    }

    @JavascriptInterface
    public void showToast(String message) {
        if (message != null && !message.isEmpty()) {
            Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void share(String title, String url) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, title != null ? title : "B2B India");
        shareIntent.putExtra(Intent.EXTRA_TEXT, (title != null ? title + "\n" : "") + url);
        mContext.startActivity(Intent.createChooser(shareIntent, "Share via B2B India"));
    }

    @JavascriptInterface
    public void vibrate(long milliseconds) {
        try {
            Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(Math.min(milliseconds, 500), VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(Math.min(milliseconds, 500));
                }
            }
        } catch (Exception ignored) {
        }
    }
}
