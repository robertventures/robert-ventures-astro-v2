// PostHog Event Tracking Utility
// Mirrors the pattern of ctaTracking.js — wraps posthog calls with safety checks
// and automatic context so callers never have to repeat page_name or ghl_contact_id.
//
// Identity model: the distinct id for every known user is their NORMALIZED EMAIL
// (trimmed + lowercased). The investor portal identifies with the same key, so
// marketing-site and portal sessions merge into one PostHog person. Merges only
// happen on the exact same string, so never identify with a raw, un-normalized
// email.
//
// Exposes three globals:
//   window.posthogTrack(eventName, properties)     — capture any event
//   window.posthogIdentifyByEmail(email, props)    — identify the user by their
//                                                    normalized email. Call at any
//                                                    point where the user tells us
//                                                    their email (form submits).
//   window.posthogSetPerson(properties)            — set person properties on the
//                                                    current profile without
//                                                    changing identity. Use for
//                                                    property-only updates (e.g.
//                                                    capital_source).
//
// On page load this script also self-identifies visitors arriving from a GHL
// email/SMS link: those links carry ?ph_id= (the GHL contact id), which is
// resolved to an email server-side via /api/resolve-contact so the email
// itself never appears in a URL (Meta/GA/RedTrack capture full page URLs).
// Same-device returns need no fallback: PostHog persists the identified
// distinct id in its own localStorage+cookie storage.

(function () {
    'use strict';

    // True once the GTM snippet has created window.posthog. The pre-load stub
    // queues calls and replays them after the real library loads, so it is safe
    // to call capture/identify against it.
    function isReady() {
        return typeof window.posthog === 'object' && typeof window.posthog.capture === 'function';
    }

    // GTM injects PostHog asynchronously; posthog-js drops calls made before
    // window.posthog exists, so late-arriving pages must wait for it.
    function whenPosthogReady(callback) {
        if (isReady()) {
            callback();
            return;
        }
        let elapsed = 0;
        const timer = setInterval(function () {
            elapsed += 250;
            if (isReady()) {
                clearInterval(timer);
                callback();
            } else if (elapsed >= 15000) {
                clearInterval(timer);
                console.warn('PostHog never loaded. Queued identify/track call dropped.');
            }
        }, 250);
    }

    function normalizeEmail(value) {
        if (typeof value !== 'string') return null;
        const email = value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        return email;
    }

    function posthogTrack(eventName, properties) {
        if (!isReady()) {
            console.warn('PostHog not ready. Event skipped:', eventName);
            return;
        }

        // Automatically merge page context so callers don't have to repeat it
        const enriched = Object.assign(
            {
                page_name: window.getPageName ? window.getPageName() : window.location.pathname,
                ghl_contact_id: localStorage.getItem('ghl_contact_id') || undefined
            },
            properties || {}
        );

        window.posthog.capture(eventName, enriched);
        console.log('PostHog event:', eventName, enriched);
    }

    function posthogIdentifyByEmail(email, userProperties) {
        const normalized = normalizeEmail(email);
        if (!normalized) {
            console.warn('PostHog identify skipped, invalid email:', email);
            return;
        }
        whenPosthogReady(function () {
            const current =
                typeof window.posthog.get_distinct_id === 'function'
                    ? window.posthog.get_distinct_id()
                    : null;
            if (current === normalized) {
                // Already identified as this email; avoid a redundant $identify
                // but still refresh person properties when provided.
                if (userProperties) window.posthog.setPersonProperties(userProperties);
                return;
            }
            window.posthog.identify(normalized, userProperties || {});
            console.log('PostHog identify:', normalized, userProperties);
        });
    }

    function posthogSetPerson(properties) {
        if (!isReady()) {
            console.warn('PostHog not ready. setPersonProperties skipped.');
            return;
        }
        window.posthog.setPersonProperties(properties);
        console.log('PostHog setPersonProperties:', properties);
    }

    // Identify visitors arriving from a GHL email/SMS link: the ?ph_id= GHL
    // contact id is swapped for the contact's email by /api/resolve-contact
    // so the email never rides in the URL. Any failure is a silent no-op.
    function identifyOnPageLoad() {
        let contactId = null;
        try {
            const raw = new URLSearchParams(window.location.search).get('ph_id');
            // Same shape check as the API route; skips junk without a request
            if (raw && /^[A-Za-z0-9]{15,32}$/.test(raw)) contactId = raw;
        } catch (e) {
            /* malformed URL, ignore */
        }
        if (!contactId) return;

        fetch('/api/resolve-contact?id=' + encodeURIComponent(contactId))
            .then(function (res) {
                return res.ok ? res.json() : null;
            })
            .then(function (data) {
                const email = data ? normalizeEmail(data.email) : null;
                if (!email) return;
                try {
                    localStorage.setItem('userEmail', email);
                } catch (e) {
                    /* storage unavailable, ignore */
                }
                posthogIdentifyByEmail(email);
            })
            .catch(function () {
                /* resolver unreachable, stay anonymous */
            });
    }

    window.posthogTrack = posthogTrack;
    window.posthogIdentifyByEmail = posthogIdentifyByEmail;
    window.posthogSetPerson = posthogSetPerson;

    identifyOnPageLoad();
})();
