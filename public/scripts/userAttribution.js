// userAttribution.js

// --- Capture UTM Parameters ---
const utmParams = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"
];

const urlParams = new URLSearchParams(window.location.search);

// Store UTM params from URL
utmParams.forEach(param => {
  const value = urlParams.get(param);
  if (value) {
    localStorage.setItem(param, value);
  }
});

// --- Google Ads Attribution ---
// If user came from Google Ads (has gclid), map Google params to UTM fields
const gclid = urlParams.get("gclid");
if (gclid) {
  // Store gclid (standard GHL field)
  localStorage.setItem("gclid", gclid);
  
  // Only set UTM fields if they weren't already set by the URL
  if (!localStorage.getItem("utm_source")) {
    localStorage.setItem("utm_source", "google");
  }
  if (!localStorage.getItem("utm_medium")) {
    localStorage.setItem("utm_medium", "cpc");
  }
  
  // Map Google Ads campaign ID to utm_campaign (if not already set)
  const gadCampaignId = urlParams.get("gad_campaignid");
  if (gadCampaignId && !localStorage.getItem("utm_campaign")) {
    localStorage.setItem("utm_campaign", gadCampaignId);
  }
  
  // Map Google keyword to utm_term (if not already set)
  const hKeyword = urlParams.get("h_keyword");
  if (hKeyword && !localStorage.getItem("utm_term")) {
    localStorage.setItem("utm_term", hKeyword);
  }
} 