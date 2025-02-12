import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_CA1G_HTi.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/login.astro.mjs');
const _page3 = () => import('./pages/api/signout.astro.mjs');
const _page4 = () => import('./pages/api/signup.astro.mjs');
const _page5 = () => import('./pages/api/signup-step-2.astro.mjs');
const _page6 = () => import('./pages/api/signup-step-3.astro.mjs');
const _page7 = () => import('./pages/api/signup-step-4.astro.mjs');
const _page8 = () => import('./pages/api/submit-form.astro.mjs');
const _page9 = () => import('./pages/api/wealthblock.astro.mjs');
const _page10 = () => import('./pages/blog.astro.mjs');
const _page11 = () => import('./pages/blog/_---slug_.astro.mjs');
const _page12 = () => import('./pages/dashboard.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/rss.xml.astro.mjs');
const _page15 = () => import('./pages/signup.astro.mjs');
const _page16 = () => import('./pages/step-2.astro.mjs');
const _page17 = () => import('./pages/step-3.astro.mjs');
const _page18 = () => import('./pages/step-4.astro.mjs');
const _page19 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/login.ts", _page2],
    ["src/pages/api/signout.ts", _page3],
    ["src/pages/api/signup.ts", _page4],
    ["src/pages/api/signup-step-2.ts", _page5],
    ["src/pages/api/signup-step-3.ts", _page6],
    ["src/pages/api/signup-step-4.ts", _page7],
    ["src/pages/api/submit-form.ts", _page8],
    ["src/pages/api/wealthblock.ts", _page9],
    ["src/pages/blog/index.astro", _page10],
    ["src/pages/blog/[...slug].astro", _page11],
    ["src/pages/dashboard.astro", _page12],
    ["src/pages/login.astro", _page13],
    ["src/pages/rss.xml.js", _page14],
    ["src/pages/signup.astro", _page15],
    ["src/pages/step-2.astro", _page16],
    ["src/pages/step-3.astro", _page17],
    ["src/pages/step-4.astro", _page18],
    ["src/pages/index.astro", _page19]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "4196806c-e0c1-417f-b6df-0c49d0135db1"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
