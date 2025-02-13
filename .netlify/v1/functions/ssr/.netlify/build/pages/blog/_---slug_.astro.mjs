import { e as createAstro, c as createComponent, r as renderTemplate, a as renderComponent } from '../../chunks/astro/server_DX3Ct7Tn.mjs';
import 'kleur/colors';
import { g as getCollection } from '../../chunks/_astro_content_Dod3Cjm4.mjs';
import { $ as $$BlogPost } from '../../chunks/BlogPost_DyIlOY0O.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://example.com");
async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post
  }));
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const post = Astro2.props;
  const { Content } = await post.render();
  return renderTemplate`${renderComponent($$result, "BlogPost", $$BlogPost, { ...post.data }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/blog/[...slug].astro", void 0);

const $$file = "/Users/eduardodematos/Documents/GitHub/robert-ventures-astro/src/pages/blog/[...slug].astro";
const $$url = "/blog/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$,
	file: $$file,
	getStaticPaths,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
