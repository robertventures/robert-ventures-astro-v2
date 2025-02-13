import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_Cq4rgWWE.mjs';
import { $ as $$Footer } from '../chunks/Footer_BKsYOzD7.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head>', "", "</head> <body> ", ' <main> <h1>login page</h1> <br> <br> <form id="login-form" action="/api/login" method="post"> <input type="email" name="email" placeholder="Your Email" required> <input type="password" name="password" placeholder="password" required> <button type="submit">login</button> </form> </main> ', ' <script>\n  document.getElementById("login-form").addEventListener("submit", async (e) => {\n    e.preventDefault();\n\n    const form = e.target;\n    const formData = new FormData(form);\n\n    try {\n      const response = await fetch(form.action, {\n        method: form.method,\n        body: formData,\n      });\n\n      if (response.ok) {\n        const result = await response.json();\n        alert("Login successful!");\n        console.log(result);\n        // Redirect to another page, e.g., the dashboard\n        window.location.href = "/dashboard"; // Change to your desired route\n      } else {\n        const error = await response.json();\n        alert(`Login failed: ${error.error}`);\n      }\n    } catch (err) {\n      console.error("Error during login:", err);\n      alert("An unexpected error occurred.");\n    }\n  });\n\n<\/script></body></html>'], ['<html lang="en"> <head>', "", "</head> <body> ", ' <main> <h1>login page</h1> <br> <br> <form id="login-form" action="/api/login" method="post"> <input type="email" name="email" placeholder="Your Email" required> <input type="password" name="password" placeholder="password" required> <button type="submit">login</button> </form> </main> ', ' <script>\n  document.getElementById("login-form").addEventListener("submit", async (e) => {\n    e.preventDefault();\n\n    const form = e.target;\n    const formData = new FormData(form);\n\n    try {\n      const response = await fetch(form.action, {\n        method: form.method,\n        body: formData,\n      });\n\n      if (response.ok) {\n        const result = await response.json();\n        alert("Login successful!");\n        console.log(result);\n        // Redirect to another page, e.g., the dashboard\n        window.location.href = "/dashboard"; // Change to your desired route\n      } else {\n        const error = await response.json();\n        alert(\\`Login failed: \\${error.error}\\`);\n      }\n    } catch (err) {\n      console.error("Error during login:", err);\n      alert("An unexpected error occurred.");\n    }\n  });\n\n<\/script></body></html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION }), renderHead(), renderComponent($$result, "Header", $$Header, {}), renderComponent($$result, "Footer", $$Footer, {}));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/login.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
