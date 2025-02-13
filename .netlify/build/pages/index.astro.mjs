import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_Cq4rgWWE.mjs';
import { $ as $$Footer } from '../chunks/Footer_BKsYOzD7.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
import '@astrojs/internal-helpers/path';
import { $ as $$Image } from '../chunks/_astro_assets_BFr7Uugx.mjs';
/* empty css                                 */
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
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-j7pv25f6> <head>', "", "</head> <body data-astro-cid-j7pv25f6> ", ' <main data-astro-cid-j7pv25f6> <h1 data-astro-cid-j7pv25f6>Open your account in under 2 minutes</h1> <form id="signup-form" data-astro-cid-j7pv25f6> <div class="group" data-astro-cid-j7pv25f6> <input type="text" name="first_name" placeholder="First Name" required data-astro-cid-j7pv25f6> <input type="text" name="last_name" placeholder="Last Name" required data-astro-cid-j7pv25f6> </div> <input type="email" name="email" placeholder="Email" required data-astro-cid-j7pv25f6> <input type="password" name="password" placeholder="Password" required data-astro-cid-j7pv25f6> <p class="signup-error" data-astro-cid-j7pv25f6></p> <button type="submit" data-astro-cid-j7pv25f6>Sign Up</button> </form> <p class="disclaimer" data-astro-cid-j7pv25f6>\nBy continuing, you agree to our\n<a href="https://robertventures.com/privacy-policy" data-astro-cid-j7pv25f6>Privacy Policy</a> and\n<a href="https://robertventures.com/terms-of-use" data-astro-cid-j7pv25f6>Terms of Use</a>.\n</p> <div class="testimonials" data-astro-cid-j7pv25f6> <div class="testimonial-photos" data-astro-cid-j7pv25f6> ', ` </div> <p class="testimonial" data-astro-cid-j7pv25f6>
\u201CI've known Joe for over a decade now and he has been more
					than just a friend but has been instrumental in our holding
					company to make accountable double-digit returns and has
					been a blessing. Always could count on him for the
					payments.\u201D
</p> <p class="testimonial-name" data-astro-cid-j7pv25f6>Steve Lloyd</p> </div> </main> `, ' <script>\n			document.addEventListener("DOMContentLoaded", async () => {\n				const form = document.getElementById("signup-form");\n				const errorElement = document.querySelector(".signup-error");\n\n				let ip_address = null;\n				try {\n					const ipResponse = await fetch(\n						"https://api64.ipify.org?format=json",\n					);\n					if (ipResponse.ok) {\n						const ipData = await ipResponse.json();\n						ip_address = ipData.ip;\n					}\n				} catch (err) {\n					console.warn("\u26A0 Error fetching IP address.");\n				}\n\n				form.addEventListener("submit", async (e) => {\n					e.preventDefault();\n					errorElement.style.display = "none";\n\n					const formData = new FormData(form);\n					const data = Object.fromEntries(formData.entries());\n					data.ip_address = ip_address;\n\n					try {\n						const response = await fetch("/api/signup", {\n							method: "POST",\n							headers: { "Content-Type": "application/json" },\n							body: JSON.stringify(data),\n						});\n\n						const result = await response.json(); // Parse the response\n\n						if (!response.ok) {\n							// Handle errors properly\n							throw new Error(result.error || "Signup failed. Please try again.");\n						}\n\n						console.log("\u2705 Signup successful! Redirecting...");\n						window.location.href = "/step-2";\n					} catch (error) {\n						console.error("\u274C Error during signup:", error);\n						errorElement.textContent = error.message;\n						errorElement.style.display = "block";\n					}\n				});\n			});\n		<\/script> </body> </html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION, "data-astro-cid-j7pv25f6": true }), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-j7pv25f6": true }), renderComponent($$result, "Image", $$Image, { "src": steve, "alt": "A description of my image.", "data-astro-cid-j7pv25f6": true }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-j7pv25f6": true }));
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
