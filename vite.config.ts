import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    minify: "esbuild",
  },
  server: {
    port: 3001,
  },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
        ],
      },
  plugins: [react()],
});
