package site.b2bindia.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.MenuItem;
import android.view.View;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.core.widget.NestedScrollView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * MainActivity
 * Full-featured, native Android shell for B2B India (b2bindia.site).
 * Integrates:
 * - Native Material Toolbar with WhatsApp and Helpline Call actions
 * - Native Bottom Navigation Bar for instant 1-tap tab switching
 * - Two-way deep linking & URL synchronization
 * - Native Offline Trade Dashboard
 * - Native JS Bridge, Camera & Storage File Chooser, and UPI intents
 */
public class MainActivity extends AppCompatActivity {

    public static final String TARGET_URL = "https://www.b2bindia.site";
    public static final String DOMAIN_HOST = "b2bindia.site";
    public static final String HELPLINE_PHONE = "+918408841998";

    private MaterialToolbar mTopToolbar;
    private WebView mWebView;
    private ProgressBar mProgressBar;
    private SwipeRefreshLayout mSwipeRefresh;
    private NestedScrollView mLayoutOfflineDashboard;
    private BottomNavigationView mBottomNavigation;

    // Offline Dashboard buttons
    private MaterialButton mBtnRetry;
    private MaterialButton mBtnOfflineCall;
    private MaterialButton mBtnOfflineWhatsapp;

    // File Upload / Camera State
    private ValueCallback<Uri[]> mFilePathCallback;
    private Uri mCameraPhotoUri;
    private ActivityResultLauncher<Intent> mFileChooserLauncher;

    private long mLastBackPressTime = 0;
    private boolean mIsNavigatingFromTab = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        setupToolbar();
        setupBottomNavigation();
        setupFileChooserLauncher();
        setupWebView();
        setupSwipeRefresh();
        setupBackNavigation();

        // Handle incoming intent or launch default marketplace
        String urlToLoad = TARGET_URL;
        if (getIntent() != null && getIntent().getData() != null) {
            urlToLoad = getIntent().getData().toString();
        }
        loadUrl(urlToLoad);
    }

    private void initViews() {
        mTopToolbar = findViewById(R.id.topToolbar);
        mWebView = findViewById(R.id.webView);
        mProgressBar = findViewById(R.id.progressBar);
        mSwipeRefresh = findViewById(R.id.swipeRefresh);
        mLayoutOfflineDashboard = findViewById(R.id.layoutOfflineDashboard);
        mBottomNavigation = findViewById(R.id.bottomNavigation);

        mBtnRetry = findViewById(R.id.btnRetry);
        mBtnOfflineCall = findViewById(R.id.btnOfflineCall);
        mBtnOfflineWhatsapp = findViewById(R.id.btnOfflineWhatsapp);

        mBtnRetry.setOnClickListener(v -> {
            if (isNetworkAvailable()) {
                mLayoutOfflineDashboard.setVisibility(View.GONE);
                mSwipeRefresh.setVisibility(View.VISIBLE);
                mWebView.reload();
            } else {
                Toast.makeText(this, "Still offline. Please check your mobile data or Wi-Fi.", Toast.LENGTH_SHORT).show();
            }
        });

        mBtnOfflineCall.setOnClickListener(v -> triggerCallIntent(HELPLINE_PHONE));
        mBtnOfflineWhatsapp.setOnClickListener(v -> triggerWhatsappIntent(HELPLINE_PHONE, "Hi B2B India Support, I need assistance with wholesale trade inquiries."));
    }

    private void setupToolbar() {
        // ── Collision fix: title only, no subtitle on small screens ──
        mTopToolbar.setTitle("B2B India");
        mTopToolbar.setSubtitle(null);

        mTopToolbar.setOnMenuItemClickListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.action_whatsapp) {
                triggerWhatsappIntent(HELPLINE_PHONE, "Hi B2B India Support, I have an inquiry regarding wholesale products.");
                return true;
            } else if (itemId == R.id.action_call) {
                triggerCallIntent(HELPLINE_PHONE);
                return true;
            }
            return false;
        });
    }

    private void setupBottomNavigation() {
        mBottomNavigation.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            mIsNavigatingFromTab = true;

            if (itemId == R.id.nav_home) {
                loadUrl(TARGET_URL + "/");
                return true;
            } else if (itemId == R.id.nav_directory) {
                loadUrl(TARGET_URL + "/directory");
                return true;
            } else if (itemId == R.id.nav_mandi) {
                loadUrl(TARGET_URL + "/market-rates");
                return true;
            } else if (itemId == R.id.nav_orders) {
                loadUrl(TARGET_URL + "/dashboard/orders");
                return true;
            } else if (itemId == R.id.nav_support) {
                loadUrl(TARGET_URL + "/support");
                return true;
            }
            return false;
        });
    }

    private void updateBottomNavSelection(String url) {
        if (mBottomNavigation == null || url == null) return;

        try {
            Uri uri = Uri.parse(url);
            String path = uri.getPath();
            if (path == null) path = "";

            int targetItemId = -1;
            if (path.isEmpty() || path.equals("/")) {
                targetItemId = R.id.nav_home;
            } else if (path.startsWith("/directory") || path.startsWith("/categories")) {
                targetItemId = R.id.nav_directory;
            } else if (path.startsWith("/market-rates") || path.startsWith("/mandi")) {
                targetItemId = R.id.nav_mandi;
            } else if (path.startsWith("/dashboard") || path.startsWith("/orders")) {
                targetItemId = R.id.nav_orders;
            } else if (path.startsWith("/support") || path.startsWith("/contact")) {
                targetItemId = R.id.nav_support;
            }

            if (targetItemId != -1 && mBottomNavigation.getSelectedItemId() != targetItemId) {
                mBottomNavigation.getMenu().findItem(targetItemId).setChecked(true);
            }
        } catch (Exception ignored) {
        }
    }

    private void triggerWhatsappIntent(String phone, String message) {
        try {
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8.name());
            String whatsappUrl = "https://api.whatsapp.com/send?phone=" + cleanPhone + "&text=" + encodedMessage;
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(whatsappUrl));
            intent.setPackage("com.whatsapp");
            startActivity(intent);
        } catch (Exception e) {
            try {
                // Fallback to browser or non-packaged intent
                String cleanPhone = phone.replaceAll("[^0-9]", "");
                String whatsappUrl = "https://api.whatsapp.com/send?phone=" + cleanPhone;
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(whatsappUrl)));
            } catch (Exception ex) {
                Toast.makeText(this, "WhatsApp is not installed on this device.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void triggerCallIntent(String phone) {
        try {
            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Cannot initiate telephone call.", Toast.LENGTH_SHORT).show();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Custom User Agent identifier
        String defaultUserAgent = settings.getUserAgentString();
        settings.setUserAgentString(defaultUserAgent + " B2BIndiaApp/1.0.0 (Android)");

        // Smart Caching
        if (isNetworkAvailable()) {
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        // Native JavaScript Interface Bridge
        mWebView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        // Download Listener
        mWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading B2B India invoice / document...");
                    request.setTitle("B2B India Document");
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "B2BIndia_Document_" + System.currentTimeMillis() + ".pdf");

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Downloading file to Downloads folder...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                }
            }
        });

        // WebChromeClient for Progress & File Uploads
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                } else {
                    mProgressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                Intent takePictureIntent = null;
                File photoFile = null;
                try {
                    photoFile = createImageFile();
                    if (photoFile != null) {
                        mCameraPhotoUri = FileProvider.getUriForFile(MainActivity.this, "site.b2bindia.app.fileprovider", photoFile);
                        takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, mCameraPhotoUri);
                    }
                } catch (IOException ignored) {
                }

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("*/*");
                String[] mimetypes = {"image/*", "application/pdf"};
                contentSelectionIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);

                Intent[] intentArray;
                if (takePictureIntent != null) {
                    intentArray = new Intent[]{takePictureIntent};
                } else {
                    intentArray = new Intent[0];
                }

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Document or Photo");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                mFileChooserLauncher.launch(chooserIntent);
                return true;
            }
        });

        // WebViewClient
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                mProgressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                mProgressBar.setVisibility(View.GONE);
                mSwipeRefresh.setRefreshing(false);

                if (!mIsNavigatingFromTab) {
                    updateBottomNavSelection(url);
                }
                mIsNavigatingFromTab = false;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && !isNetworkAvailable()) {
                    mSwipeRefresh.setVisibility(View.GONE);
                    mLayoutOfflineDashboard.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // 1. UPI Payment Links (Razorpay, BHIM, Google Pay, PhonePe, Paytm)
                if (url.startsWith("upi://pay") || url.startsWith("phonepe://") || url.startsWith("paytmmp://") || url.startsWith("tez://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "No supported UPI payment app found.", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // 2. WhatsApp Direct Inquiries
                if (url.startsWith("whatsapp://") || url.contains("api.whatsapp.com") || url.contains("wa.me")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "WhatsApp is not installed on this device.", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // 3. Phone calls
                if (url.startsWith("tel:")) {
                    Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }

                // 4. Mailto links
                if (url.startsWith("mailto:")) {
                    Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }

                // 5. Internal Platform Navigation
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && (host.endsWith(DOMAIN_HOST) || host.contains("localhost"))) {
                    return false;
                }

                // 6. External URLs
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
        });
    }

    private void setupSwipeRefresh() {
        // Premium brand color scheme for pull-to-refresh indicator
        mSwipeRefresh.setColorSchemeResources(
            R.color.primary,
            R.color.accent_gold,
            R.color.accent_emerald,
            R.color.accent_purple
        );
        mSwipeRefresh.setProgressBackgroundColorSchemeResource(R.color.surface);
        mSwipeRefresh.setOnRefreshListener(() -> {
            if (isNetworkAvailable()) {
                mLayoutOfflineDashboard.setVisibility(View.GONE);
                mSwipeRefresh.setVisibility(View.VISIBLE);
                mWebView.reload();
            } else {
                mSwipeRefresh.setRefreshing(false);
                Toast.makeText(MainActivity.this, "Offline. Cannot refresh live data.", Toast.LENGTH_SHORT).show();
            }
        });

        mWebView.getViewTreeObserver().addOnScrollChangedListener(() -> {
            mSwipeRefresh.setEnabled(mWebView.getScrollY() == 0);
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (mWebView.canGoBack()) {
                    mWebView.goBack();
                } else {
                    if (System.currentTimeMillis() - mLastBackPressTime < 2000) {
                        finish();
                    } else {
                        mLastBackPressTime = System.currentTimeMillis();
                        Toast.makeText(MainActivity.this, "Press back again to exit B2B India", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }

    private void setupFileChooserLauncher() {
        mFileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (mFilePathCallback == null) return;
                    Uri[] results = null;

                    if (result.getResultCode() == Activity.RESULT_OK) {
                        Intent data = result.getData();
                        if (data != null && data.getData() != null) {
                            results = new Uri[]{data.getData()};
                        } else if (mCameraPhotoUri != null) {
                            results = new Uri[]{mCameraPhotoUri};
                        }
                    }
                    mFilePathCallback.onReceiveValue(results);
                    mFilePathCallback = null;
                }
        );
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    private void loadUrl(String url) {
        if (isNetworkAvailable()) {
            mLayoutOfflineDashboard.setVisibility(View.GONE);
            mSwipeRefresh.setVisibility(View.VISIBLE);
            mWebView.loadUrl(url);
        } else {
            mSwipeRefresh.setVisibility(View.GONE);
            mLayoutOfflineDashboard.setVisibility(View.VISIBLE);
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.net.Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
            return capabilities != null && (
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
            );
        } else {
            android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnected();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
