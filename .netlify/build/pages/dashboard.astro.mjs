import { c as createComponent, r as renderTemplate, a as renderComponent, b as renderHead } from '../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { a as $$Header, $ as $$BaseHead } from '../chunks/Header_Cq4rgWWE.mjs';
import { $ as $$Footer } from '../chunks/Footer_BKsYOzD7.mjs';
import { S as SITE_DESCRIPTION, a as SITE_TITLE } from '../chunks/consts_DaG9i4bq.mjs';
import { s as supabase } from '../chunks/supabase_Cp-Rfy68.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Dashboard = createComponent(async ($$result, $$props, $$slots) => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
        // Redirect to the login page if not logged in
      }
    });
  }
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head>', "", "</head> <body> ", ' <main> <h1>Dashboard</h1> <br> <br> <button id="signout-button">Sign Out</button> </main> ', ' <script>\n\ndocument.getElementById("signout-button").addEventListener("click", async () => {\n    try {\n      const response = await fetch("/api/signout", {\n        method: "POST",\n      });\n\n      if (response.ok) {\n        const result = await response.json();\n        alert(result.message);\n        // Redirect to home or login page after signout\n        window.location.href = "/";\n      } else {\n        const error = await response.json();\n        alert(`Signout failed: ${error.error}`);\n      }\n    } catch (err) {\n      console.error("Error during signout:", err);\n      alert("An unexpected error occurred.");\n    }\n  });\n\n\n<\/script></body></html>'], ['<html lang="en"> <head>', "", "</head> <body> ", ' <main> <h1>Dashboard</h1> <br> <br> <button id="signout-button">Sign Out</button> </main> ', ' <script>\n\ndocument.getElementById("signout-button").addEventListener("click", async () => {\n    try {\n      const response = await fetch("/api/signout", {\n        method: "POST",\n      });\n\n      if (response.ok) {\n        const result = await response.json();\n        alert(result.message);\n        // Redirect to home or login page after signout\n        window.location.href = "/";\n      } else {\n        const error = await response.json();\n        alert(\\`Signout failed: \\${error.error}\\`);\n      }\n    } catch (err) {\n      console.error("Error during signout:", err);\n      alert("An unexpected error occurred.");\n    }\n  });\n\n\n<\/script></body></html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": SITE_TITLE, "description": SITE_DESCRIPTION }), renderHead(), renderComponent($$result, "Header", $$Header, {}), renderComponent($$result, "Footer", $$Footer, {}));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/dashboard.astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/dashboard.astro";
const $$url = "/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
