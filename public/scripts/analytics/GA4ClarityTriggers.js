console.log("Hello from trigger");


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

// Make triggerEvent globally accessible
// window.triggerEvent = triggerEvent;

// function initializeEventListeners() {
//     console.log("Event triggers loaded from Direct GTM");

//     // Track form submissions for .conversion_v1
//     document.querySelectorAll('#form-cta').forEach(function (form) {
//         form.addEventListener('submit', function () {
//             triggerEvent('get_started_conversion', 'GetStarted');
//         });
//     });


//     // // Track interactions with calculator inputs
//     const calculatorInputs = document.querySelectorAll('.financial-future-section input');
//     const hasInteracted = false;

//     calculatorInputs.forEach(function (input) {
//         input.addEventListener('click', function () {
//             if (!hasInteracted) {
//                 hasInteracted = true;
//                 console.log('User interacted with the calculator');
//                 triggerEvent('calculator_interaction', 'CalculatorInteraction');
//             } else {
//                 console.log('User already interacted with the calculator. Skipping.');
//             }
//         });
//     });
// }

// Check if DOM is already loaded
// if (document.readyState === 'loading') {
//     console.log("Waiting for DOMContentLoaded...");
//     document.addEventListener('DOMContentLoaded', initializeEventListeners);
// } else {
//     console.log("DOM already loaded, initializing listeners immediately");
//     initializeEventListeners();
// }

