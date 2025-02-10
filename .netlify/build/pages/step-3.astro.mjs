import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_pgatvEbp.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Step3 = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-2mcmjpbp> <head>', "", "</head> <body data-astro-cid-2mcmjpbp> ", ` <main data-astro-cid-2mcmjpbp> <h1 data-astro-cid-2mcmjpbp>Federal regulations require us to verify your identity</h1> <form id="signup-form-step-3" action="/api/signup-step-3" method="post" data-astro-cid-2mcmjpbp> <input type="tel" id="phone" name="phone_number" placeholder="Phone number" required data-astro-cid-2mcmjpbp> <button type="submit" data-astro-cid-2mcmjpbp>Next</button> <p class="disclaimer" data-astro-cid-2mcmjpbp>
By clicking next, you consent to Robert Ventures sending you
                    emails and text messages.
</p> <!-- <p class="disclaimer">
                    Your information is secured with AES 128-bit encryption.
                </p> --> </form> </main> <script>
    document.addEventListener("DOMContentLoaded", () => {
        const phoneInput = document.getElementById("phone");

        phoneInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\\D/g, ""); // Remove non-numeric characters

            // Ensure it always starts with +1
            if (!value.startsWith("1")) {
                value = "1" + value;
            }

            // Format phone number as +1 (XXX) XXX-XXXX
            let formattedNumber = "+1";
            if (value.length > 1) {
                formattedNumber += " (" + value.substring(1, 4);
            }
            if (value.length >= 4) {
                formattedNumber += ") " + value.substring(4, 7);
            }
            if (value.length >= 7) {
                formattedNumber += "-" + value.substring(7, 11);
            }

            e.target.value = formattedNumber;
        });

        document.getElementById("signup-form-step-3").addEventListener("submit", async (e) => {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);
            let phoneValue = phoneInput.value.replace(/\\D/g, ""); // Remove all non-numeric characters

            // \u2705 Ensure phone number is valid (10 digits after country code)
            if (phoneValue.length !== 11 || !phoneValue.startsWith("1")) {
                console.warn("\u26A0 Invalid phone number entered:", phoneValue);
                alert("Please enter a valid US phone number.");
                return;
            }

            // \u2705 Retrieve GoHighLevel Contact ID from localStorage
            const ghlContactId = localStorage.getItem("ghl_contact_id");

            if (!ghlContactId) {
                console.error("GoHighLevel Contact ID not found in localStorage!");
                alert("Error: Unable to find your contact ID. Please restart signup.");
                return;
            }

            formData.append("ghl_contact_id", ghlContactId);
            formData.set("phone_number", phoneValue); // Ensure it's stored in raw format

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("Step 3 Completed:", result);
                    window.location.href = "/step-4"; // Proceed to Step 4
                } else {
                    const error = await response.json();
                    console.error("\u274C Signup failed:", error.error);
                }
            } catch (err) {
                console.error("\u274C Error during signup:", err);
            }
        });
    });
<\/script></body></html>`], ['<html lang="en" data-astro-cid-2mcmjpbp> <head>', "", "</head> <body data-astro-cid-2mcmjpbp> ", ` <main data-astro-cid-2mcmjpbp> <h1 data-astro-cid-2mcmjpbp>Federal regulations require us to verify your identity</h1> <form id="signup-form-step-3" action="/api/signup-step-3" method="post" data-astro-cid-2mcmjpbp> <input type="tel" id="phone" name="phone_number" placeholder="Phone number" required data-astro-cid-2mcmjpbp> <button type="submit" data-astro-cid-2mcmjpbp>Next</button> <p class="disclaimer" data-astro-cid-2mcmjpbp>
By clicking next, you consent to Robert Ventures sending you
                    emails and text messages.
</p> <!-- <p class="disclaimer">
                    Your information is secured with AES 128-bit encryption.
                </p> --> </form> </main> <script>
    document.addEventListener("DOMContentLoaded", () => {
        const phoneInput = document.getElementById("phone");

        phoneInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\\\\D/g, ""); // Remove non-numeric characters

            // Ensure it always starts with +1
            if (!value.startsWith("1")) {
                value = "1" + value;
            }

            // Format phone number as +1 (XXX) XXX-XXXX
            let formattedNumber = "+1";
            if (value.length > 1) {
                formattedNumber += " (" + value.substring(1, 4);
            }
            if (value.length >= 4) {
                formattedNumber += ") " + value.substring(4, 7);
            }
            if (value.length >= 7) {
                formattedNumber += "-" + value.substring(7, 11);
            }

            e.target.value = formattedNumber;
        });

        document.getElementById("signup-form-step-3").addEventListener("submit", async (e) => {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);
            let phoneValue = phoneInput.value.replace(/\\\\D/g, ""); // Remove all non-numeric characters

            // \u2705 Ensure phone number is valid (10 digits after country code)
            if (phoneValue.length !== 11 || !phoneValue.startsWith("1")) {
                console.warn("\u26A0 Invalid phone number entered:", phoneValue);
                alert("Please enter a valid US phone number.");
                return;
            }

            // \u2705 Retrieve GoHighLevel Contact ID from localStorage
            const ghlContactId = localStorage.getItem("ghl_contact_id");

            if (!ghlContactId) {
                console.error("GoHighLevel Contact ID not found in localStorage!");
                alert("Error: Unable to find your contact ID. Please restart signup.");
                return;
            }

            formData.append("ghl_contact_id", ghlContactId);
            formData.set("phone_number", phoneValue); // Ensure it's stored in raw format

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("Step 3 Completed:", result);
                    window.location.href = "/step-4"; // Proceed to Step 4
                } else {
                    const error = await response.json();
                    console.error("\u274C Signup failed:", error.error);
                }
            } catch (err) {
                console.error("\u274C Error during signup:", err);
            }
        });
    });
<\/script></body></html>`])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-2mcmjpbp": true }), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-2mcmjpbp": true }));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-3.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-3.astro";
const $$url = "/step-3";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Step3,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
