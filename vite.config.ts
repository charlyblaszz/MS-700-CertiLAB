import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: { ignored: ["**/work/portable/**", "**/work/checks/**", "**/outputs/**"] },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  build: {
    outDir: mode === "portable" ? "work/portable" : "dist",
    rolldownOptions: mode === "portable" ? { output: { codeSplitting: false } } : undefined,
    sourcemap: false,
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
}));
