/**
 * Mapping of internal field slug → GoHighLevel v2 custom field UUID.
 *
 * Generated from `GET https://services.leadconnectorhq.com/locations/{locationId}/customFields`.
 * Regenerate if custom fields are added/renamed in GHL.
 *
 * Slugs NOT present here are intentionally skipped when building the v2 payload
 * (the field doesn't exist as a GHL column, so v1 was silently dropping them too):
 *   - google_matchtype, google_adgroup_id, google_creative_id, google_campaign_id
 *   - google_device, google_ad_position, google_network, google_placement
 *   - wbraid, gbraid
 *   - webinar_date, webinar_full_date, webinar_session_date (legacy duplicates)
 */
export const GHL_FIELDS: Record<string, string> = {
  // Investment / lead qualification
  invest_intent: "4XtyXY1JnTkA3hMBxyUy",
  capital_source: "9ZUHlbi9VSBKJouwSE7r",
  investment_timeline: "rRO6kkHOEVTebWrPJnUo",

  // Webinar metadata
  webinar_sign_up_date: "YSy3GxzlUlw0Wx7KJl0q",
  webinar_signup_date: "x5bDrENtM4t9qcTvQ5cE",
  webinar_date__time: "kn1lPAtdvX244zxoG1jq",
  webinar_datetime_user_tz: "meZeQErkTxQB0w9ccfcj",
  webinar_event_date: "uSVTXTGQenTsekosm9Xa",
  webinar_calendar_url: "0aIdsk0jUKgGsKOvUIyZ",

  // Device / location / user info
  device_type: "fkAZAPLXGlYxktGrQQl1",
  userip: "vz09czK2TQnF32ExTca2",
  landing_video: "Avx2fuWh0vdJJG9FfnKk",
  zip_income_level: "uCXVwkhL9gR63VZS23DN",

  // UTM
  utm_source: "8ldggo0WRHPHt9oB4bkV",
  utm_medium: "HoG3ilxBCbc6egSicCSR",
  utm_campaign: "Tl1wP7Mqf1MbNZ437ByA",
  utm_content: "IAcq6q2gM6ers2tPhokV",
  utm_term: "40kNiQ66BQv6VMlMuiGx",
  utm_id: "aWNy0imWBhHmRyVVEMez",

  // Click IDs / attribution
  google_click_id: "nnePgIs0ev8lTg8hgURv",
  rtk_click_id: "zLWtIRfcn7Tx6o0gNg1Y",
  cmpid: "DAlSvxRupu3EehKpU8Q2",
  ad_group: "oZAhbI6MM69v8BlLyFr4",

  // Facebook attribution
  fb_ad_id: "WgrAfc6N09hnZCPpIkr0",
  fb_adset_id: "wRx063iP1rFGtvHiUWqI",
  fb_placement: "P9aB9cZpc77nvI5IiDN5",
  fb_site_source: "CtawMntYAT3EheoNnJbw",
};

export const GHL_V2_BASE = "https://services.leadconnectorhq.com";
export const GHL_V2_VERSION = "2021-07-28";
