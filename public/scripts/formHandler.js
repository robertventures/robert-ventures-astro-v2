// Retrieve the email from localStorage and use it as needed
const storedEmail = localStorage.getItem("userEmail");

console.log("hello from form handler")

// Capture the page load time
const pageLoadTime = performance.now();

let userIpAddress = localStorage.getItem("userIP");

if (!userIpAddress) {
    // Measure the time taken to fetch the user's IP address
    const startTime = performance.now();

    // Fetch the user's IP address
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => {
            userIpAddress = data.ip;
            localStorage.setItem("userIP", userIpAddress); // Store IP address in localStorage
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            const totalTimeSincePageLoad = endTime - pageLoadTime;
            console.log("User IP Address:", userIpAddress);
            console.log("Time taken to capture IP address:", timeTaken.toFixed(2), "milliseconds");
            console.log("Total time since page load to capture IP address:", totalTimeSincePageLoad.toFixed(2), "milliseconds");
        })
        .catch(error => {
            console.error("Error fetching IP address:", error);
        });
}

document.querySelectorAll("#form-cta").forEach(form => {

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = form.querySelector(".email-input");
        const email = emailInput.value;
        const botField = form.querySelector(".bot-field").value;
        const buttonText = form.querySelector(".button-text");
        const loader = form.querySelector(".loader");
        const signupError = form.querySelector(".signup-error");

        // Bot prevention check
        if (botField) {
            signupError.textContent = "Bot detected.";
            signupError.style.display = "block";
            return;
        }

        buttonText.style.display = "none";
        loader.style.display = "inline-block";
        signupError.style.display = "none";

        // Get user's timezone
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Retrieve the IP address from localStorage
        const storedIpAddress = localStorage.getItem("userIP");

        // Log the data being sent to the API
        const requestData = { email, timeZone, ipAddress: storedIpAddress };

        // Store the email in localStorage
        localStorage.setItem("userEmail", email);

        try {
            const response = await fetch("/api/get-started", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const result = await response.json();
                const errorMessage = result.error || "Signup failed";
                signupError.textContent = errorMessage;
                signupError.style.display = "block";
                console.error("Error response:", result);
            } else {
                console.log("Signup successful!");
                // triggerEvent("get_started_conversion", "GetStarted");
                window.location.href = "/signup";
            }
        } catch (error) {
            console.error("Network error:", error);
            signupError.textContent = "Network error occurred. Please try again later.";
            signupError.style.display = "block";
        } finally {
            buttonText.style.display = "inline-block";
            loader.style.display = "none";
        }
    });
});
