import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    allowedHosts: ["acp-verifier-production.up.railway.app", "areweacpyet.com"],
  },
});
