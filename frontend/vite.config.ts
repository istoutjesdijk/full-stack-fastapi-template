import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig, loadEnv } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read the dev port from the root .env (single source of truth for ports),
  // so multiple stacks generated from this template can run side by side.
  const rootEnv = loadEnv(mode, path.resolve(__dirname, ".."), "")
  return {
    server: {
      host: true,
      port: Number(rootEnv.FRONTEND_PORT) || 5173,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
  }
})
