// userAttribution.js
(function () {
  // --- Capture UTM Parameters ---
  var utmParams = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"
  ];

  var urlParams = new URLSearchParams(window.location.search);
  var dynamicUtmParams = [];

  // Collect any additional regular UTM keys (utm_*)
  urlParams.forEach(function (_value, key) {
    if (key.indexOf("utm_") === 0 && utmParams.indexOf(key) === -1) {
      dynamicUtmParams.push(key);
    }
  });

  var allUtmParams = utmParams.concat(dynamicUtmParams);

  // Store UTM params from URL
  allUtmParams.forEach(function (param) {
    var value = urlParams.get(param);
    if (value) {
      localStorage.setItem(param, value);
    }
  });

  var utmSource = (urlParams.get("utm_source") || "").toLowerCase();
  var refId = urlParams.get("ref_id");

  // --- Google Ads Attribution ---
  // If user came from Google Ads, store click IDs and RedTrack Google metadata
  var gclid = urlParams.get("gclid");
  if (!gclid && utmSource === "google" && refId) {
    // RedTrack often forwards gclid in ref_id
    gclid = refId;
  }

  if (gclid) {
    // Store gclid (standard GHL field)
    localStorage.setItem("gclid", gclid);

    // Backfill UTM source/medium for Google if URL did not provide them
    if (!urlParams.get("utm_source")) {
      localStorage.setItem("utm_source", "google");
    }
    if (!urlParams.get("utm_medium")) {
      localStorage.setItem("utm_medium", "cpc");
    }
  }

  if (utmSource === "google") {
    var googleSubParamMap = {
      sub3: "google_matchtype",
      sub4: "google_adgroup_id",
      sub5: "google_creative_id",
      sub6: "google_campaign_id",
      sub7: "google_device",
      sub8: "google_ad_position",
      sub9: "google_network",
      sub10: "google_placement"
    };

    Object.keys(googleSubParamMap).forEach(function (subKey) {
      var value = urlParams.get(subKey);
      if (value) {
        localStorage.setItem(googleSubParamMap[subKey], value);
      }
    });

    var wbraid = urlParams.get("wbraid");
    if (wbraid) {
      localStorage.setItem("wbraid", wbraid);
    }

    var gbraid = urlParams.get("gbraid");
    if (gbraid) {
      localStorage.setItem("gbraid", gbraid);
    }
  }

  // --- Facebook/RedTrack Attribution ---
  // Detect Facebook traffic by utm_source and capture each sub field independently
  if (utmSource === "facebook") {
    var fbAdId = urlParams.get("sub1");
    if (fbAdId) {
      localStorage.setItem("fb_ad_id", fbAdId);
    }

    var fbAdsetId = urlParams.get("sub2");
    if (fbAdsetId) {
      localStorage.setItem("fb_adset_id", fbAdsetId);
    }

    var fbCampaignId = urlParams.get("sub3");
    if (fbCampaignId) {
      localStorage.setItem("utm_id", fbCampaignId);
    }

    var fbPlacement = urlParams.get("sub7");
    if (fbPlacement) {
      localStorage.setItem("fb_placement", fbPlacement);
    }

    var fbSiteSource = urlParams.get("sub8");
    if (fbSiteSource) {
      localStorage.setItem("fb_site_source", fbSiteSource);
    }

    if (refId) {
      localStorage.setItem("fb_ref_id", refId);
    }
  }
})();
