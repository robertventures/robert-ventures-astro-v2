import { e as createAstro, c as createComponent, r as renderTemplate, d as addAttribute, m as maybeRenderHead, a as renderComponent } from './astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                         */
import '@astrojs/internal-helpers/path';
import { $ as $$Image } from './_astro_assets_BFr7Uugx.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://example.com");
const $$BaseHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseHead;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site);
  const { title, description, image = "../images/logos/rv-icon.png" } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<!-- Global Metadata --><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/svg+xml" href="/rv-icon.png"><meta name="generator"', '><!-- Font preloads --><link rel="preload" href="/fonts/atkinson-regular.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="/fonts/atkinson-bold.woff" as="font" type="font/woff" crossorigin><!-- Canonical URL --><link rel="canonical"', "><script>\n	(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n	  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n	  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n	  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n	})(window,document,'script','dataLayer','GTM-NK8975F');\n  <\/script>"])), addAttribute(Astro2.generator, "content"), addAttribute(canonicalURL, "href"));
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/components/BaseHead.astro", void 0);

const RVLogo = new Proxy({"src":"/_astro/rv-logo.B78UYdyl.png","width":236,"height":72,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/images/logos/rv-logo.png";
							}
							
							return target[name];
						}
					});

const $$Header = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header data-astro-cid-3ef6ksr2> <nav data-astro-cid-3ef6ksr2> <h2 data-astro-cid-3ef6ksr2><a href="/" data-astro-cid-3ef6ksr2>${renderComponent($$result, "Image", $$Image, { "src": RVLogo, "alt": "Robert Ventures Logo", "data-astro-cid-3ef6ksr2": true })}</a></h2> </nav> </header> `;
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/components/Header.astro", void 0);

export { $$BaseHead as $, $$Header as a };
