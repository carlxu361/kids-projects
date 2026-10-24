import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [react(), glsl()],
  resolve: {
    dedupe: ["react", "react-dom", "three"],
  },
  optimizeDeps: {
    entries: ["src/main.tsx"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
