import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_Cq4rgWWE.mjs';
import { $ as $$Footer } from '../chunks/Footer_BKsYOzD7.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Step2 = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-dkbl4zda> <head>', "", "</head> <body data-astro-cid-dkbl4zda> ", ` <main data-astro-cid-dkbl4zda> <h1 data-astro-cid-dkbl4zda>Before you start, tell us a bit about yourself</h1> <form id="signup-form-step-2" action="/api/signup-step-2" method="post" data-astro-cid-dkbl4zda> <p class="portfolio-info" data-astro-cid-dkbl4zda>
What is the approximate size of your liquid investments
                    portfolio?
</p> <div class="portfolio-value-container" data-astro-cid-dkbl4zda> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="0" required data-astro-cid-dkbl4zda>
I don't have a portfolio
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="10,000" data-astro-cid-dkbl4zda>
Around 10k
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="50,000" data-astro-cid-dkbl4zda>
Around 50k
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="100,000" data-astro-cid-dkbl4zda>
Around 100k
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="500,000" data-astro-cid-dkbl4zda>
Around 500k
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="1,000,000" data-astro-cid-dkbl4zda>
Around 1 million
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="portfolio_value" value="5,000,000" data-astro-cid-dkbl4zda>
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
                /> --> <p class="portfolio-info" data-astro-cid-dkbl4zda>When are you planning to invest?</p> <div class="investment-urgency-options" data-astro-cid-dkbl4zda> <label data-astro-cid-dkbl4zda> <input type="radio" name="investment_urgency" value="now" data-astro-cid-dkbl4zda>
Immediately
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="investment_urgency" value="1 month" data-astro-cid-dkbl4zda>
Within a month
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="investment_urgency" value="3 months" data-astro-cid-dkbl4zda>
Within 3 months
</label> <label data-astro-cid-dkbl4zda> <input type="radio" name="investment_urgency" value="1 year" data-astro-cid-dkbl4zda>
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
                </select> --> <button type="submit" data-astro-cid-dkbl4zda>Next</button> </form> </main> `, ' <script>\n    document\n        .getElementById("signup-form-step-2")\n        .addEventListener("submit", async (e) => {\n            e.preventDefault();\n\n            const form = e.target;\n            const formData = new FormData(form);\n\n            /*\n             * NEW FUNCTIONALITY: Retrieve GoHighLevel Contact ID from localStorage\n             * This will ensure we send the correct ID to update the GoHighLevel contact.\n             */\n            const ghlContactId = localStorage.getItem("ghl_contact_id");\n\n            if (!ghlContactId) {\n                console.warn(\n                    "GoHighLevel Contact ID not found in localStorage!",\n                );\n            } else {\n                console.log(\n                    "Retrieved GHL Contact ID from localStorage:",\n                    ghlContactId,\n                );\n                formData.append("ghl_contact_id", ghlContactId);\n            }\n\n            try {\n                const response = await fetch(form.action, {\n                    method: form.method,\n                    body: formData,\n                });\n\n                if (response.ok) {\n                    const result = await response.json();\n                    console.log("Step 2 Completed:", result);\n                    window.location.href = "/step-3"; // Proceed to Step 3\n                } else {\n                    const error = await response.json();\n                    console.error("Signup failed:", error.error);\n                }\n            } catch (err) {\n                console.error("Error during signup:", err);\n            }\n        });\n<\/script></body></html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-dkbl4zda": true }), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-dkbl4zda": true }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-dkbl4zda": true }));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-2.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-2.astro";
const $$url = "/step-2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Step2,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
