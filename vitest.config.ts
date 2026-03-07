import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run tests in Node environment (no browser needed for pure function tests)
    environment: "node",
  },
});
