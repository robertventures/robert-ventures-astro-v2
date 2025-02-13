import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead, m as maybeRenderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_Cq4rgWWE.mjs';
import { $ as $$Footer } from '../chunks/Footer_BKsYOzD7.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
import '@astrojs/internal-helpers/path';
import { $ as $$Image } from '../chunks/_astro_assets_BFr7Uugx.mjs';
/* empty css */
export { renderers } from '../renderers.mjs';

const steve = new Proxy({"src":"/_astro/steve-lloyd.CS6Xtyt4.png","width":160,"height":160,"format":"png"}, {
    get(target, name, receiver) {
        if (name === 'clone') {
            return structuredClone(target);
        }
        if (name === 'fsPath') {
            return "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/images/testimonials/steve-lloyd.png";
        }
        return target[name];
    }
});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template([
    '<html lang="en" data-astro-cid-j7pv25f6> <head>', 
    "", 
    "</head> <body data-astro-cid-j7pv25f6> ", 
    ' <main data-astro-cid-j7pv25f6> <h1 data-astro-cid-j7pv25f6>Open your account in under 2 minutes</h1> <form id="signup-form" data-astro-cid-j7pv25f6> <div class="group" data-astro-cid-j7pv25f6> <input type="text" name="first_name" placeholder="First Name" required data-astro-cid-j7pv25f6> <input type="text" name="last_name" placeholder="Last Name" required data-astro-cid-j7pv25f6> </div> <input type="email" name="email" placeholder="Email" required data-astro-cid-j7pv25f6> <input type="password" name="password" placeholder="Password" required data-astro-cid-j7pv25f6> <p class="signup-error" data-astro-cid-j7pv25f6></p> <button type="submit" data-astro-cid-j7pv25f6>Sign Up</button> </form> <p class="disclaimer" data-astro-cid-j7pv25f6>\nBy continuing, you agree to our\n<a href="https://robertventures.com/privacy-policy" data-astro-cid-j7pv25f6>Privacy Policy</a> and\n<a href="https://robertventures.com/terms-of-use" data-astro-cid-j7pv25f6>Terms of Use</a>.\n</p> <div class="testimonials" data-astro-cid-j7pv25f6> <div class="testimonial-photos" data-astro-cid-j7pv25f6> ', 
    ` </div> <p class="testimonial" data-astro-cid-j7pv25f6>\u201CI've known Joe for over a decade now and he has been instrumental in making accountable double-digit returns.\u201D</p> <p class="testimonial-name" data-astro-cid-j7pv25f6>Steve Lloyd</p> </div> </main> `,
    ` <script>
        document.addEventListener("DOMContentLoaded", async () => {
            const form = document.getElementById("signup-form");
            const errorElement = document.querySelector(".signup-error");

            let ip_address = null;
            try {
                const ipResponse = await fetch("https://api64.ipify.org?format=json");
                if (ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    ip_address = ipData.ip;
                }
            } catch (err) {
                console.warn("⚠ Error fetching IP address.");
            }

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                errorElement.style.display = "none";

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                data.ip_address = ip_address; 

                try {
                    const response = await fetch("/api/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || "Signup failed. Please try again.");
                    }

                    if (result.session) {
                        localStorage.setItem("supabase_token", result.session.access_token);
                    }

                    if (result.ghl_id) {
                        localStorage.setItem("ghl_contact_id", result.ghl_id);
                    }

                    console.log("✅ Signup successful! Redirecting...");
                    window.location.href = "/step-2";
                } catch (error) {
                    console.error("❌ Error during signup:", error);
                    errorElement.textContent = error.message;
                    errorElement.style.display = "block";
                }
            });
        });
    </script> </body> </html>`
  ])), 
  renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-j7pv25f6": true }), 
  renderHead(), 
  renderComponent($$result, "Header", $$Header, { "data-astro-cid-j7pv25f6": true }), 
  renderComponent($$result, "Image", $$Image, { "src": steve, "alt": "A description of my image.", "data-astro-cid-j7pv25f6": true }), 
  renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-j7pv25f6": true }));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/index.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
