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
const $$Step4 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-f4yu24zv> <head>', "", "</head> <body data-astro-cid-f4yu24zv> ", ` <main data-astro-cid-f4yu24zv> <h1 class="heading" data-astro-cid-f4yu24zv>
Let's finalize your account with a quick call
</h1> <iframe src="https://api.leadconnectorhq.com/widget/booking/xNXEISjf314X2BFZvdaZ" style="width: 100%;border:none;overflow: hidden;" scrolling="no" id="xNXEISjf314X2BFZvdaZ_1727445052062" data-astro-cid-f4yu24zv>
            </iframe> <script src="https://link.msgsndr.com/js/form_embed.js" type="text/javascript"><\/script> <a class="button" href="https://invest.robertventures.com/login?f=1" data-astro-cid-f4yu24zv>Log In</a> </main> `, ' <script>\n    window.addEventListener("message", (event) => {\n        console.log("\u{1F4E9} Message from iframe:", event);\n\n        // Ensure the message comes from GoHighLevel (LeadConnector)\n        if (!event.origin.includes("leadconnectorhq.com")) {\n            return;\n        }\n\n        // Log full event data\n        console.log("\u{1F50D} Full event data:", event.data);\n\n        // \u2705 Detect booking completion event\n        if (\n            Array.isArray(event.data) &&\n            event.data[0] === "msgsndr-booking-complete"\n        ) {\n            console.log("\u2705 Booking detected! Redirecting user to /login...");\n            document.querySelector("h1.heading").style.display = "none";\n            document.querySelector("a.button").style.display = "block";\n        }\n    });\n<\/script></body></html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-f4yu24zv": true }), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-f4yu24zv": true }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-f4yu24zv": true }));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-4.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/step-4.astro";
const $$url = "/step-4";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Step4,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
