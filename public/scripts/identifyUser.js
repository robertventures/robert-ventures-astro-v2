console.log("identify user loaded");

// Capture the page load time for performance measurement
const pageLoadTime = performance.now();

// Retrieve the user's IP address from localStorage if it exists
let userIpAddress = localStorage.getItem("userIP");

if (!userIpAddress) {
    // Measure the time taken to fetch the user's IP address
    const startTime = performance.now();

    // Fetch the user's IP address using an external API
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => {
            userIpAddress = data.ip;
            localStorage.setItem("userIP", userIpAddress); // Store IP address in localStorage
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            const totalTimeSincePageLoad = endTime - pageLoadTime;

            // Log performance metrics and the user's IP address
            console.log("User IP Address:", userIpAddress);
            console.log("Time taken to capture IP address:", timeTaken.toFixed(2), "milliseconds");
            console.log("Total time since page load to capture IP address:", totalTimeSincePageLoad.toFixed(2), "milliseconds");
        })
        .catch(error => {
            console.error("Error fetching IP address:", error); // Handle errors gracefully
        });
}

// Extract the utm_campaign parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
const utmCampaign = urlParams.get("utm_campaign");

if (utmCampaign) {
    // Store the utm_campaign in localStorage
    localStorage.setItem("utmCampaign", utmCampaign);
}