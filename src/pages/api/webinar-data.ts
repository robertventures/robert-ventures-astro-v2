/**
 * Webinar Data API Route
 *
 * This API endpoint fetches available webinar session dates and times from WebinarKit platform.
 * It's used by frontend components to populate webinar scheduling options for users.
 *
 * Purpose:
 * - Provides real-time webinar availability data
 * - Enables dynamic date/time selection in registration forms
 * - Ensures users can only select currently available sessions
 *
 * Data Flow:
 * Input → WebinarKit API → Process Response → Return Formatted Data
 *     ↓         ↓              ↓               ↓
 *   GET     fetch dates    format/clean       JSON response
 *  request   from platform    data            to frontend
 *
 * Usage:
 * - Called by FormWebinar.astro component for session selection
 * - Called by HeroboxWebinarThank.astro for confirmation displays
 * - Frontend caches response briefly to reduce API calls
 *
 * Environment Variables Required:
 * - WEBINARKIT_API_KEY: Authentication token for WebinarKit API access
 */

import type { APIRoute } from "astro";

export const prerender = false; // Ensure this route is server-rendered for API access

export const GET: APIRoute = async () => {
  // ========================================
  // CONFIGURATION & SETUP
  // ========================================

  // WebinarKit webinar identifier - this is the specific webinar we're fetching dates for
  // USED BY: WebinarKit API endpoint construction
  const webinarId = "684ae034de7a164da41abe10";

  // API authentication key from environment variables
  // USED BY: WebinarKit API authentication header
  const apiKey = import.meta.env.WEBINARKIT_API_KEY;

  // Construct the WebinarKit API endpoint URL
  // USED BY: Making the HTTP request to fetch webinar dates
  const apiUrl = `https://webinarkit.com/api/webinar/dates/${webinarId}`;

  // Validate API key availability
  if (!apiKey) {
    console.error("❌ WEBINARKIT_API_KEY environment variable not set");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing API key" }),
      {
        status: 500,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
      }
    );
  }

  console.log("🔗 Fetching webinar dates from WebinarKit API...");

  try {
    // ========================================
    // WEBINARKIT API REQUEST
    // ========================================

    // Make authenticated GET request to WebinarKit API
    // USED BY: Fetching available webinar session dates and times
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        // Bearer token authentication for WebinarKit API
        Authorization: `Bearer ${apiKey}`
      },
      // Follow any HTTP redirects automatically
      redirect: "follow" as RequestRedirect,
    });

    console.log("📥 WebinarKit API response status:", response.status);

    // ========================================
    // ERROR HANDLING
    // ========================================

    if (!response.ok) {
      console.error("❌ Failed to fetch webinar dates:", response.status, response.statusText);

      // Handle different types of API errors
      let errorMessage = "Failed to fetch webinar dates";
      if (response.status === 401) {
        errorMessage = "Authentication failed - invalid API key";
      } else if (response.status === 404) {
        errorMessage = "Webinar not found - invalid webinar ID";
      } else if (response.status >= 500) {
        errorMessage = "WebinarKit server error - please try again later";
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "application/json"
          }
        }
      );
    }

    // ========================================
    // SUCCESS RESPONSE PROCESSING
    // ========================================

    // Parse the JSON response from WebinarKit
    // USED BY: Extracting webinar date/time information
    const data = await response.json();

    console.log("✅ Successfully fetched webinar dates");
    console.log("📊 Webinar data received:", JSON.stringify(data, null, 2));

    // Return the webinar data to the frontend
    // USED BY: Frontend components for displaying available sessions
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Prevent caching to ensure fresh data on each request
        // USED BY: Ensuring users see current webinar availability
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });

  } catch (error) {
    // ========================================
    // NETWORK/PARSING ERROR HANDLING
    // ========================================

    console.error("❌ Unexpected error while fetching webinar data:", error);

    // Handle network errors, parsing errors, or other unexpected issues
    return new Response(
      JSON.stringify({
        error: "An error occurred while fetching webinar data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          // Prevent caching of error responses
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  }
};