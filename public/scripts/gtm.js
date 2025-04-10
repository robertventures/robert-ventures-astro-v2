(function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-NK8975F');

console.log("Attempting to load GTM...");

// Function to load GA4 directly
function loadGA4() {
    console.log("Loading GA4 directly...");
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-Q00DB4C68L";
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-Q00DB4C68L', {
        // cookie_flags: 'SameSite=None; Secure',
        // allow_ad_personalization_signals: false,
        // debug_mode: true
    });
}

// Function to load Clarity directly
function loadClarity() {
    console.log("Loading Microsoft Clarity directly...");
    (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "iyocd8lpma");
}

// Check for GTM, GA4, and Microsoft Clarity every 3 seconds (increased interval)
let attempts = 0;
let gtmLogged = false;
let clarityLogged = false;

const interval = setInterval(() => {
    attempts++;

    // Check if GA4 is loaded by looking for GA4-related events in the dataLayer
    let ga4Loaded = window.dataLayer && window.dataLayer.some(event => event.event === 'gtm.js' || event.event === 'config');

    let clarityLoaded = typeof clarity === 'function';

    // Check if GTM is loaded
    if (window.dataLayer && window.dataLayer.some(event => event.event === 'gtm.js')) {
        if (!gtmLogged) {
            console.log("GTM is loaded");
            gtmLogged = true; // Avoid logging repeatedly
        }
    } else {
        console.log("GTM is not loaded");
    }

    // Load GA4 directly if not loaded
    if (!ga4Loaded) {
        console.log("Google Analytics is not loaded yet");
        loadGA4();
    } else {
        console.log("Google Analytics is loaded");
    }

    // Load Clarity directly if not loaded
    if (!clarityLoaded) {
        console.log("Microsoft Clarity is not loaded yet");
        loadClarity();
    } else if (!clarityLogged) {
        console.log("Microsoft Clarity is loaded");
        clarityLogged = true; // Avoid logging repeatedly
    }

    // Stop checking if both GA4 and Clarity are loaded
    if (ga4Loaded && clarityLoaded) {
        clearInterval(interval);
        console.log("GA4 and Microsoft Clarity are loaded. Stopping checks.");
        return;
    }

    // Stop checking after 15 seconds (5 attempts with 3-second intervals)
    if (attempts >= 5) {
        clearInterval(interval);
        console.log("Finished checking for GTM, Google Analytics, and Microsoft Clarity");
    }
}, 3000); // Increased interval to 3 seconds