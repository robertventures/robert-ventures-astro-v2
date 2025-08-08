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
    try {
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
    } catch (error) {
        console.error("Error loading GA4:", error);
    }
}

// Function to load Clarity directly
function loadClarity() {
    console.log("Loading Microsoft Clarity directly...");
    try {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "iyocd8lpma");
    } catch (error) {
        console.error("Error loading Clarity:", error);
    }
}

// Check for GTM, GA4, and Microsoft Clarity every 3 seconds
let attempts = 0;
let gtmLogged = false;
let ga4Logged = false;
let clarityLogged = false;

const interval = setInterval(() => {
    attempts++;

    // Check if GTM is loaded
    const gtmLoaded = window.dataLayer && window.dataLayer.some(event => event.event === 'gtm.js');
    
    // Check if GA4 is loaded by looking for gtag function
    const ga4Loaded = typeof gtag === 'function';
    
    // Check if Clarity is loaded
    const clarityLoaded = typeof clarity === 'function';

    // Log GTM status
    if (gtmLoaded && !gtmLogged) {
        console.log("GTM is loaded");
        gtmLogged = true;
    } else if (!gtmLoaded) {
        console.log("GTM is not loaded");
    }

    // Load GA4 directly if not loaded
    if (!ga4Loaded && !ga4Logged) {
        console.log("Google Analytics is not loaded yet");
        loadGA4();
        ga4Logged = true;
    } else if (ga4Loaded && !ga4Logged) {
        console.log("Google Analytics is loaded");
        ga4Logged = true;
    }

    // Load Clarity directly if not loaded
    if (!clarityLoaded && !clarityLogged) {
        console.log("Microsoft Clarity is not loaded yet");
        loadClarity();
        clarityLogged = true;
    } else if (clarityLoaded && !clarityLogged) {
        console.log("Microsoft Clarity is loaded");
        clarityLogged = true;
    }

    // Stop checking if all services are loaded or after timeout
    if ((ga4Loaded && clarityLoaded) || attempts >= 5) {
        clearInterval(interval);
        console.log("Finished checking for GTM, Google Analytics, and Microsoft Clarity");
    }
}, 3000);