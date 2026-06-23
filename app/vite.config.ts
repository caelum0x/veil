import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production build config. URLs are injected at build time from VITE_* env vars
// (see .env.example); point them at your deployed relayer/indexer/RPC for prod.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split heavy vendor deps into their own cacheable chunks so app code can
        // ship small, incremental updates without re-downloading the SDK.
        manualChunks: {
          stellar: ["@stellar/stellar-sdk"],
          freighter: ["@stellar/freighter-api"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
