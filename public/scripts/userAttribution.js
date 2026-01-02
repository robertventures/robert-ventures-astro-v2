// userAttribution.js

// --- Capture User IP ---
const pageLoadTime = performance.now();
let userIpAddress = localStorage.getItem("userIP");
if (!userIpAddress) {
    const startTime = performance.now();
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => {
            userIpAddress = data.ip;
            localStorage.setItem("userIP", userIpAddress);
            const endTime = performance.now();
            console.log("User IP Address:", userIpAddress);
            console.log("Time taken to capture IP address:", (endTime - startTime).toFixed(2), "ms");
        })
        .catch(error => {
            console.error("Error fetching IP address:", error);
        });
}

// --- Capture UTM Parameters ---
const utmParams = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"
];

// --- Capture Google Ads Parameters ---
const googleAdsParams = [
  "gclid", "gad_source", "gad_campaignid", "h_keyword"
];

const urlParams = new URLSearchParams(window.location.search);

// Store UTM params
utmParams.forEach(param => {
  const value = urlParams.get(param);
  if (value) {
    localStorage.setItem(param, value);
  }
});

// Store Google Ads params
googleAdsParams.forEach(param => {
  const value = urlParams.get(param);
  if (value) {
    localStorage.setItem(param, value);
  }
}); 