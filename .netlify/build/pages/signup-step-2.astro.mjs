import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_BUNk7Egf.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
/* empty css                                         */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$SignupStep2 = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-4zzpisu6> <head>', "", "</head> <body data-astro-cid-4zzpisu6> ", ` <main data-astro-cid-4zzpisu6> <h1 data-astro-cid-4zzpisu6>Before you start, tell us a bit about yourself</h1> <form id="signup-form-step-2" action="/api/signup-step-2" method="post" data-astro-cid-4zzpisu6> <p class="portfolio-info" data-astro-cid-4zzpisu6>
What is the approximate size of your liquid investments
                    portfolio?
</p> <div class="portfolio-value-container" data-astro-cid-4zzpisu6> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="no" required data-astro-cid-4zzpisu6>
I don't have a portfolio
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="10k" data-astro-cid-4zzpisu6>
Around 10k
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="50k" data-astro-cid-4zzpisu6>
Around 50k
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="100k" data-astro-cid-4zzpisu6>
Around 100k
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="500k" data-astro-cid-4zzpisu6>
Around 500k
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="1m" data-astro-cid-4zzpisu6>
Around 1 million
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="portfolio_value" value="5m+" data-astro-cid-4zzpisu6>
Over 5 million
</label> </div> <!-- <input
                    type="number"
                    name="age"
                    placeholder="age"
                    required
                /> --> <!-- <input
                    type="text"
                    name="zipcode"
                    placeholder="zipcode"
                    required
                /> --> <p class="portfolio-info" data-astro-cid-4zzpisu6>When are you planning to invest?</p> <div class="investment-urgency-options" data-astro-cid-4zzpisu6> <label data-astro-cid-4zzpisu6> <input type="radio" name="investment_urgency" value="now" data-astro-cid-4zzpisu6>
Immediately
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="investment_urgency" value="1_month" data-astro-cid-4zzpisu6>
Within a month
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="investment_urgency" value="3_months" data-astro-cid-4zzpisu6>
Within 3 months
</label> <label data-astro-cid-4zzpisu6> <input type="radio" name="investment_urgency" value="1_year" data-astro-cid-4zzpisu6>
Within a year
</label> </div> <!-- <p>What are your investment objectives?</p>
                <select name="investment_objective">
                    <option selected hidden value="null">Select one</option>
                    <option value="tax_preparation">Tax preparation</option>
                    <option value="management_new_wealth">Management of new wealth</option>
                    <option value="retirement_plan">Retirement plan</option>
                    <option value="estate_planning">Estate planning</option>
                    <option value="social_investing">Estate planning</option>
                    <option value="tax-aware_investing">Tax-Aware investing</option>
                    <option value="low_fee_solution">Low-Fee solution</option>
                    <option value="portfolio_management">Portfolio management</option>
                </select> --> <button type="submit" data-astro-cid-4zzpisu6>Next</button> </form> </main> <script>
    document
        .getElementById("signup-form-step-2")
        .addEventListener("submit", async (e) => {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);

            /*
             * NEW FUNCTIONALITY: Retrieve GoHighLevel Contact ID from localStorage
             * This will ensure we send the correct ID to update the GoHighLevel contact.
             */
            const ghlContactId = localStorage.getItem("ghl_contact_id");

            if (!ghlContactId) {
                console.warn(
                    "GoHighLevel Contact ID not found in localStorage!",
                );
            } else {
                console.log(
                    "Retrieved GHL Contact ID from localStorage:",
                    ghlContactId,
                );
                formData.append("ghl_contact_id", ghlContactId);
            }

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("Step 2 Completed:", result);
                    window.location.href = "/signup-step-3"; // Proceed to Step 3
                } else {
                    const error = await response.json();
                    console.error("Signup failed:", error.error);
                }
            } catch (err) {
                console.error("Error during signup:", err);
            }
        });
<\/script></body></html>`])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-4zzpisu6": true }), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-4zzpisu6": true }));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/signup-step-2.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/signup-step-2.astro";
const $$url = "/signup-step-2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$SignupStep2,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
