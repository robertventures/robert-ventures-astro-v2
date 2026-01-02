// CTA Click Tracking
// Tracks button/link clicks with page name and button location
// Works across all pages via data attributes

(function() {
    'use strict';

    // Map URL paths to page names
    function getPageName() {
        const path = window.location.pathname;
        
        // Exact matches first
        const pageMap = {
            '/': 'homepage',
            '/strategy': 'strategy',
            '/about-us': 'about_us',
            '/articles': 'articles',
            '/articles/': 'articles',
            '/reviews': 'reviews',
            '/calendar': 'calendar',
            '/webinar': 'webinar',
            '/questions': 'questions',
            '/webinar-thank-you': 'webinar_thank_you',
            '/webinar-2': 'webinar',
            '/webinar-follow-up': 'webinar_follow_up',
            '/privacy-policy': 'privacy_policy',
            '/terms-of-use': 'terms_of_use',
            '/cookie-policy': 'cookie_policy',
            '/disclaimer': 'disclaimer'
        };

        // Check exact match
        if (pageMap[path]) {
            return pageMap[path];
        }

        // Check for article detail pages
        if (path.startsWith('/articles/') && path.length > '/articles/'.length) {
            return 'article_detail';
        }

        // Default fallback - use path as page name
        return path.replace(/^\//, '').replace(/\/$/, '').replace(/-/g, '_') || 'unknown';
    }

    // Function to trigger CTA click events for Microsoft Clarity and GA4
    function triggerCtaEvent(ctaText, buttonLocation, eventOverride) {
        const pageName = getPageName();
        const eventName = eventOverride || 'cta_click';
        
        const eventData = {
            'event': eventName,
            'cta_text': ctaText,
            'page_name': pageName,
            'button_location': buttonLocation
        };

        // Push event to Google Tag Manager's dataLayer
        if (window.dataLayer) {
            window.dataLayer.push(eventData);
            console.log('GA4 ' + eventName + ' event triggered:', eventData);
        } else {
            console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
        }

        // Send event to Microsoft Clarity
        if (typeof clarity === 'function') {
            // Set custom tags for Clarity session
            clarity('set', 'cta_text', ctaText);
            clarity('set', 'page_name', pageName);
            clarity('set', 'button_location', buttonLocation);
            clarity('event', eventName);
            console.log('Clarity ' + eventName + ' event triggered:', eventData);
        } else {
            console.warn('Microsoft Clarity is not initialized.');
        }
    }

    // Function to trigger phone click events
    function triggerPhoneEvent(phoneNumber, buttonLocation) {
        const pageName = getPageName();
        
        const eventData = {
            'event': 'phone_click',
            'phone_number': phoneNumber,
            'page_name': pageName,
            'button_location': buttonLocation
        };

        // Push event to Google Tag Manager's dataLayer
        if (window.dataLayer) {
            window.dataLayer.push(eventData);
            console.log('GA4 phone_click event triggered:', eventData);
        } else {
            console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
        }

        // Send event to Microsoft Clarity
        if (typeof clarity === 'function') {
            clarity('set', 'phone_number', phoneNumber);
            clarity('set', 'page_name', pageName);
            clarity('set', 'button_location', buttonLocation);
            clarity('event', 'phoneClick');
            console.log('Clarity phone_click event triggered:', eventData);
        } else {
            console.warn('Microsoft Clarity is not initialized.');
        }
    }

    // Function to trigger social media click events
    function triggerSocialEvent(platform, clickLocation) {
        const eventData = {
            'event': 'social_click',
            'platform': platform,
            'click_location': clickLocation
        };

        // Push event to Google Tag Manager's dataLayer
        if (window.dataLayer) {
            window.dataLayer.push(eventData);
            console.log('GA4 social_click event triggered:', eventData);
        } else {
            console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
        }

        // Send event to Microsoft Clarity
        if (typeof clarity === 'function') {
            clarity('set', 'platform', platform);
            clarity('set', 'click_location', clickLocation);
            clarity('event', 'socialClick');
            console.log('Clarity social_click event triggered:', eventData);
        } else {
            console.warn('Microsoft Clarity is not initialized.');
        }
    }

    // Function to trigger navigation click events
    function triggerNavEvent(linkText, clickLocation) {
        const eventData = {
            'event': 'navigation_click',
            'link_text': linkText,
            'click_location': clickLocation
        };

        // Push event to Google Tag Manager's dataLayer
        if (window.dataLayer) {
            window.dataLayer.push(eventData);
            console.log('GA4 navigation_click event triggered:', eventData);
        } else {
            console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
        }

        // Send event to Microsoft Clarity
        if (typeof clarity === 'function') {
            clarity('set', 'link_text', linkText);
            clarity('set', 'click_location', clickLocation);
            clarity('event', 'navigationClick');
            console.log('Clarity navigation_click event triggered:', eventData);
        } else {
            console.warn('Microsoft Clarity is not initialized.');
        }
    }

    // Initialize CTA tracking
    function init() {
        // Use event delegation on document body for all CTA clicks
        document.body.addEventListener('click', function(event) {
            // Find closest element with tracking data attribute
            const ctaElement = event.target.closest('[data-track-cta]');
            
            if (ctaElement) {
                const ctaText = ctaElement.dataset.trackCta;
                const buttonLocation = ctaElement.dataset.trackLocation || 'unknown';
                const eventOverride = ctaElement.dataset.trackEvent || null;
                
                triggerCtaEvent(ctaText, buttonLocation, eventOverride);
            }

            // Check for phone click tracking
            const phoneElement = event.target.closest('[data-track-phone]');
            
            if (phoneElement) {
                const phoneNumber = phoneElement.dataset.trackPhone;
                const buttonLocation = phoneElement.dataset.trackLocation || 'footer';
                
                triggerPhoneEvent(phoneNumber, buttonLocation);
            }

            // Check for social media click tracking
            const socialElement = event.target.closest('[data-track-social]');
            
            if (socialElement) {
                const platform = socialElement.dataset.trackSocial;
                const clickLocation = socialElement.dataset.trackLocation || 'footer';
                
                triggerSocialEvent(platform, clickLocation);
            }

            // Check for navigation click tracking
            const navElement = event.target.closest('[data-track-nav]');
            
            if (navElement) {
                const linkText = navElement.dataset.trackNav;
                const clickLocation = navElement.dataset.trackLocation || 'unknown';
                
                triggerNavEvent(linkText, clickLocation);
            }
        });
    }

    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions globally for inline usage if needed
    window.triggerCtaEvent = triggerCtaEvent;
    window.triggerPhoneEvent = triggerPhoneEvent;
    window.triggerSocialEvent = triggerSocialEvent;
    window.triggerNavEvent = triggerNavEvent;
    window.getPageName = getPageName;
})();

