import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: "autoUpdate",
      manifest: {
        name: "Every Idea Counts",
        short_name: "EIC",
        start_url: "/capture",
        display: "standalone",
        theme_color: "#4F46E5",
        background_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/supabase/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes("supabase.co"),
            handler: "NetworkOnly"
          }
        ]
      }
    })
  ],
})
