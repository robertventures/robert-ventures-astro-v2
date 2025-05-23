

// Select all forms with the ID "form-cta" and attach event listeners
document.querySelectorAll("#form-cta").forEach(form => {
    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Retrieve form elements
        const emailInput = form.querySelector(".email-input");
        const email = emailInput.value; // Get the user's email input
        const botField = form.querySelector(".bot-field").value; // Hidden field for bot detection
        const buttonText = form.querySelector(".button-text");
        const loader = form.querySelector(".loader");
        const signupError = form.querySelector(".signup-error");

        // Bot prevention check: If the hidden field is filled, it's likely a bot
        if (botField) {
            signupError.textContent = "Bot detected.";
            signupError.style.display = "block";
            return;
        }

        // Show the loader and hide the button text during the submission process
        buttonText.style.display = "none";
        loader.style.display = "inline-block";
        signupError.style.display = "none"; // Hide any previous error messages


        // Store the email in localStorage for future use
        localStorage.setItem("userEmail", email);

        // Get the user's timezone using the browser's Intl API
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Retrieve the IP address and utm_campaign from localStorage
        const storedIpAddress = localStorage.getItem("userIP");
        const storedUtmCampaign = localStorage.getItem("utmCampaign");


        // Set the user's email or unique ID in Microsoft Clarity for tracking
        if (window.clarity && email) {
            window.clarity("identify", email); // Replace "userId" with your desired property name
        }

        // Prepare the data to be sent to the API
        const requestData = {
            email,
            timeZone,
            ipAddress: storedIpAddress,
            utmCampaign: storedUtmCampaign // Include the utm_campaign
        };

        try {
            // Send the form data to the server via a POST request
            const response = await fetch("/api/get-started", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData), // Convert the data to JSON
            });

            if (!response.ok) {
                // If the response is not OK, handle the error
                const result = await response.json();
                const errorMessage = result.error || "Signup failed";
                signupError.textContent = errorMessage; // Display the error message
                signupError.style.display = "block";
                console.error("Error response:", result);
            } else {
                // If the response is successful, log success and redirect the user
                console.log("Signup successful!");
                triggerEvent("get_started_conversion", "GetStarted"); // Custom event tracking
                window.location.href = "/signup"; // Redirect to the signup page
            }
        } catch (error) {
            // Handle network errors gracefully
            console.error("Network error:", error);
            signupError.textContent = "Network error occurred. Please try again later.";
            signupError.style.display = "block";
        } finally {
            // Restore the button text and hide the loader after the process is complete
            buttonText.style.display = "inline-block";
            loader.style.display = "none";
        }
    });
});
