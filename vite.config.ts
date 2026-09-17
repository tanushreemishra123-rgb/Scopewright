import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// viteSingleFile inlines all JS/CSS into one index.html so the built app is a
// single, zero-dependency file that opens in any browser (great for reviewers).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: "es2020", assetsInlineLimit: 100000000, cssCodeSplit: false },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
