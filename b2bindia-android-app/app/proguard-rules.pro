# Add project specific ProGuard rules here.
# Keep WebView and JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepclassmembers class site.b2bindia.app.WebAppInterface {
    <methods>;
}
