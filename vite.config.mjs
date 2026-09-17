import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  root: "renderer",
  publicDir: mode === "mobile" ? "../.mobile-public" : false,
  plugins: [react()],
  define: {
    __ODINS_MOBILE_BUILD__: JSON.stringify(mode === "mobile"),
  },
  build: {
    outDir: "../renderer-dist",
    emptyOutDir: true,
  },
}));
