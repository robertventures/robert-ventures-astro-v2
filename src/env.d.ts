/// <reference types="astro/client" />

// Environment variables
interface ImportMetaEnv {
  readonly SENJA_API_KEY: string;
  readonly SITE: string;
  readonly META_PIXEL_ID?: string;
  readonly META_ACCESS_TOKEN?: string;
  readonly META_TEST_EVENT_CODE?: string;
  readonly GHL_API_KEY?: string;
  readonly GHL_PIT?: string;
  readonly WEBINARKIT_API_KEY?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
