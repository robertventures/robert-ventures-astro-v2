(function () {
  var TRACKING_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
    "gclid"
  ];

  function getStoredParams() {
    var result = {};

    try {
      TRACKING_PARAMS.forEach(function (param) {
        var value = localStorage.getItem(param);
        if (value) {
          result[param] = value;
        }
      });
    } catch (e) {
      // localStorage may be blocked in some privacy contexts.
      return {};
    }

    return result;
  }

  function decorateInvestLinks() {
    var storedParams = getStoredParams();
    var keys = Object.keys(storedParams);

    if (!keys.length) {
      return;
    }

    var links = document.querySelectorAll('a[href*="invest.robertventures.com"]');

    links.forEach(function (link) {
      try {
        var url = new URL(link.href, window.location.origin);

        keys.forEach(function (key) {
          if (!url.searchParams.get(key)) {
            url.searchParams.set(key, storedParams[key]);
          }
        });

        link.href = url.toString();
      } catch (e) {
        // Ignore malformed URLs so one bad link doesn't break all others.
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateInvestLinks);
  } else {
    decorateInvestLinks();
  }
})();
