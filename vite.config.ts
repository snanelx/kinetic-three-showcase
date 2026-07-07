import { defineConfig } from "vite";

export default defineConfig({
  base: "/kinetic-three-showcase/",
  build: {
    outDir: "docs",
    emptyOutDir: false
  },
  server: {
    port: 5175
  }
});
