

// Retrieve the email from localStorage and use it as needed
const storedEmail = localStorage.getItem("userEmail");

console.log("hello from formHandler")

document.querySelectorAll("form").forEach(form => {

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

        // Log the data being sent to the API
        const requestData = { email, timeZone };

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
