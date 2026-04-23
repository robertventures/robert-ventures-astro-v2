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

// Check for GTM and GA4 every 3 seconds
let attempts = 0;
let gtmLogged = false;
let ga4Logged = false;

const interval = setInterval(() => {
    attempts++;

    // Check if GTM is loaded
    const gtmLoaded = window.dataLayer && window.dataLayer.some(event => event.event === 'gtm.js');

    // Check if GA4 is loaded by looking for gtag function
    const ga4Loaded = typeof gtag === 'function';

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

    // Stop checking if GA4 is loaded or after timeout
    if (ga4Loaded || attempts >= 5) {
        clearInterval(interval);
        console.log("Finished checking for GTM and Google Analytics");
    }
}, 3000);