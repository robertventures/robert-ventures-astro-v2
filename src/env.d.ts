/// <reference types="astro/client" />

// Extend Astro's HTML attributes to include humblytics
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    humblytics?: string;
  }
}

// Environment variables
interface ImportMetaEnv {
  readonly SENJA_API_KEY: string;
  readonly SITE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
