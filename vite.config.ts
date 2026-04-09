import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Ignore the rust folder and ALL .jsonl files in the project
      ignored: ["**/src-tauri/**", "**/*.jsonl"],
    },
  },
}));