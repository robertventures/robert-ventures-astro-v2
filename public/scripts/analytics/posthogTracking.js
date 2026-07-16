// PostHog Event Tracking Utility
// Mirrors the pattern of ctaTracking.js — wraps posthog calls with safety checks
// and automatic context so callers never have to repeat page_name or ghl_contact_id.
//
// Exposes three globals:
//   window.posthogTrack(eventName, properties)   — capture any event
//   window.posthogSetPerson(properties)          — set person properties on the
//                                                  current profile without changing
//                                                  identity. Fallback for flows that
//                                                  don't have a GHL contact id yet.
//   window.posthogIdentify(distinctId, props)    — identify a user by a REAL stable
//                                                  id. On the marketing site that is
//                                                  the GHL CONTACT ID (returned by
//                                                  the registration/booking APIs and
//                                                  mirrored in localStorage).
//                                                  Never identify by email: the
//                                                  investor portal identifies by its
//                                                  user.id and merges contact-id ↔
//                                                  user.id at account creation
//                                                  (lib/posthogIdentify.js in
//                                                  investor-desk-frontend), so the
//                                                  pre-signup journey survives.

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

    // Only for a REAL stable id — on this site, the GHL contact id. Do not call
    // this with an email or any browser-scoped value — see the header comment.
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

    window.posthogTrack = posthogTrack;
    window.posthogIdentify = posthogIdentify;
    window.posthogSetPerson = posthogSetPerson;
})();
