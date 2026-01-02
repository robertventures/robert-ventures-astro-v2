// Scroll Depth Tracking
// Tracks when users scroll to 25%, 50%, 75%, and 100% thresholds
// Each threshold fires only once per page load
// Includes page_name for analytics segmentation

(function() {
    'use strict';

    // Map URL paths to page names
    function getPageName() {
        var path = window.location.pathname;
        
        // Exact matches first
        var pageMap = {
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
        if (path.indexOf('/articles/') === 0 && path.length > '/articles/'.length) {
            return 'article_detail';
        }

        // Default fallback - use path as page name
        return path.replace(/^\//, '').replace(/\/$/, '').replace(/-/g, '_') || 'unknown';
    }

    // Thresholds to track
    var thresholds = [25, 50, 75, 100];
    
    // Track which thresholds have been reached
    var reachedThresholds = {};
    
    // Flag to prevent multiple rAF calls
    var ticking = false;

    // Function to trigger events for Microsoft Clarity and GA4
    function triggerScrollEvent(percentage) {
        var pageName = getPageName();
        
        var eventData = {
            'event': 'scroll_depth',
            'page_name': pageName,
            'scroll_percentage': percentage
        };

        // Push event to Google Tag Manager's dataLayer
        if (window.dataLayer) {
            window.dataLayer.push(eventData);
            console.log('GA4 scroll_depth event triggered:', eventData);
        } else {
            console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
        }

        // Send event to Microsoft Clarity
        if (typeof clarity === 'function') {
            // Set custom tags for Clarity session
            clarity('set', 'page_name', pageName);
            clarity('set', 'scroll_percentage', String(percentage));
            clarity('event', 'scrollDepth' + percentage);
            console.log('Clarity scroll_depth event triggered:', eventData);
        } else {
            console.warn('Microsoft Clarity is not initialized.');
        }
    }

    // Calculate current scroll percentage
    function getScrollPercentage() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        // Handle edge case where page doesn't scroll
        if (scrollHeight <= 0) {
            return 100;
        }
        
        return Math.round((scrollTop / scrollHeight) * 100);
    }

    // Check and fire threshold events
    function checkThresholds() {
        var currentPercentage = getScrollPercentage();
        
        thresholds.forEach(function(threshold) {
            if (currentPercentage >= threshold && !reachedThresholds[threshold]) {
                reachedThresholds[threshold] = true;
                triggerScrollEvent(threshold);
            }
        });
        
        ticking = false;
    }

    // Throttled scroll handler using requestAnimationFrame
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(checkThresholds);
            ticking = true;
        }
    }

    // Initialize scroll tracking
    function init() {
        // Add scroll event listener
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Check initial scroll position (user might have scrolled before script loaded)
        // Use setTimeout to ensure DOM is ready
        setTimeout(checkThresholds, 100);
    }

    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

