import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/server.ts",
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: "server.js",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});
