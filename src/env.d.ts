/// <reference types="astro/client" />

// Extend Astro's HTML attributes to include humblytics
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    humblytics?: string;
  }
}
