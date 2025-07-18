declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Extend HTML attributes for Astro components
declare module 'astro:runtime' {
  interface HTMLAttributes {
    humblytics?: string;
  }
}

// Also extend the base HTML element interfaces
interface HTMLElement {
  humblytics?: string;
}

interface HTMLAnchorElement {
  humblytics?: string;
}

interface HTMLButtonElement {
  humblytics?: string;
}

export {}; 