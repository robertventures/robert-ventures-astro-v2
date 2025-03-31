// Function to trigger events for Microsoft Clarity and GA4
function triggerEvent(eventName, clarityEventName) {
    // Push event to Google Tag Manager's dataLayer
    if (window.dataLayer) {
        dataLayer.push({
            'event': eventName
        });
        console.log('GA4 event triggered: ' + eventName);
    } else {
        console.warn('dataLayer is not defined. Ensure Google Tag Manager is properly initialized.');
    }

    // Send event to Microsoft Clarity
    if (typeof clarity === 'function') {
        clarity('event', clarityEventName);
        console.log('Clarity event triggered: ' + clarityEventName);
    } else {
        console.warn('Microsoft Clarity is not initialized.');
    }
}



