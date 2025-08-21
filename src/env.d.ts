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
  readonly META_PIXEL_ID?: string;
  readonly META_ACCESS_TOKEN?: string;
  readonly META_TEST_EVENT_CODE?: string;
  readonly GHL_API_KEY?: string;
  readonly WEBINARKIT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
