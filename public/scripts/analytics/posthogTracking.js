// PostHog Event Tracking Utility
// Mirrors the pattern of ctaTracking.js — wraps posthog calls with safety checks
// and automatic context so callers never have to repeat page_name or ghl_contact_id.
//
// Exposes three globals:
//   window.posthogTrack(eventName, properties)   — capture any event
//   window.posthogSetPerson(properties)          — set person properties on the
//                                                  current (anonymous) profile,
//                                                  without identifying. Use this
//                                                  for email/name/etc. on the
//                                                  marketing site.
//   window.posthogIdentify(distinctId, props)    — identify a user by a REAL stable
//                                                  user id (e.g. a portal user.id).
//                                                  NOT used by the marketing site
//                                                  today: we don't have a stable id
//                                                  here, and identifying by email
//                                                  would collide with the investor
//                                                  portal's identify(user.id) and
//                                                  sever the pre-signup journey.
//                                                  Webinar registrants get email/name
//                                                  via posthogSetPerson instead.

(function () {
    'use strict';

    function isReady() {
        return typeof window.posthog === 'object' && typeof window.posthog.capture === 'function';
    }

    function posthogTrack(eventName, properties) {
        if (!isReady()) {
            console.warn('PostHog not ready. Event skipped:', eventName);
            return;
        }

        // Automatically merge page context so callers don't have to repeat it
        var enriched = Object.assign(
            {
                page_name: window.getPageName ? window.getPageName() : window.location.pathname,
                ghl_contact_id: localStorage.getItem('ghl_contact_id') || undefined
            },
            properties || {}
        );

        window.posthog.capture(eventName, enriched);
        console.log('PostHog event:', eventName, enriched);
    }

    // Only for a REAL stable user id (e.g. an investor-portal user.id). Do not call
    // this with an email or any browser-scoped value — see the header comment.
    // Currently unused on the marketing site; kept so the portal-style pattern is
    // available if a stable id ever exists here.
    function posthogIdentify(distinctId, userProperties) {
        if (!isReady()) {
            console.warn('PostHog not ready. Identify skipped for:', distinctId);
            return;
        }
        window.posthog.identify(distinctId, userProperties || {});
        console.log('PostHog identify:', distinctId, userProperties);
    }

    function posthogSetPerson(properties) {
        if (!isReady()) {
            console.warn('PostHog not ready. setPersonProperties skipped.');
            return;
        }
        window.posthog.setPersonProperties(properties);
        console.log('PostHog setPersonProperties:', properties);
    }

    // Identify returning visitors arriving from our own GHL emails/SMS.
    // Links in GHL templates append ?ph_id={{contact.id}} (the GHL contact
    // id — opaque, no PII in the URL). This is what recognizes a lead on a
    // NEW device or browser, which ad clicks can never do. PostHog loads
    // async via GTM, so poll until it's ready (up to ~10s, then give up).
    function identifyFromUrlParam() {
        var phId;
        try {
            phId = new URLSearchParams(window.location.search).get('ph_id');
        } catch (e) {
            return;
        }
        // GHL contact ids are 18-24 char alphanumeric; ignore anything else.
        if (!phId || !/^[A-Za-z0-9]{18,24}$/.test(phId)) return;

        // Mirror to localStorage so posthogTrack() enriches events with it
        // and the booking/registration flows recognize the visitor.
        try {
            localStorage.setItem('ghl_contact_id', phId);
        } catch (e) {}

        var tries = 0;
        var timer = setInterval(function () {
            if (isReady()) {
                clearInterval(timer);
                window.posthog.identify(phId);
                console.log('PostHog identify from ph_id URL param');
            } else if (++tries >= 100) {
                clearInterval(timer);
            }
        }, 100);
    }
    identifyFromUrlParam();

    window.posthogTrack = posthogTrack;
    window.posthogIdentify = posthogIdentify;
    window.posthogSetPerson = posthogSetPerson;
})();
