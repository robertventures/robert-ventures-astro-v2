declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  // Splide is loaded from CDN in Testimonials.astro — declare as a global class
  // so TypeScript knows it exists at runtime without needing the npm package.
  const Splide: new (
    selector: string,
    options?: Record<string, unknown>
  ) => {
    mount: () => void;
    [key: string]: unknown;
  };
}

export {};
