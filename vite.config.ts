import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) {
              return "firebase-sdk";
            }
            if (id.includes("@tanstack")) {
              return "tanstack-router";
            }
            if (id.includes("motion") || id.includes("framer-motion")) {
              return "motion-anim";
            }
            if (id.includes("lucide-react")) {
              return "lucide-icons";
            }
            if (id.includes("react-dom") || id.includes("react")) {
              return "react-core";
            }
            return "vendor";
          }
          // Split all primary application routes into their own dedicated chunks
          if (id.includes("src/routes/dashboard")) {
            return "route-dashboard";
          }
          if (id.includes("src/routes/galerie")) {
            return "route-galerie";
          }
          if (id.includes("src/routes/espace-etudiant")) {
            return "route-espace-etudiant";
          }
          if (id.includes("src/routes/inscription")) {
            return "route-inscription";
          }
          if (id.includes("src/routes/a-propos")) {
            return "route-apropos";
          }
          if (id.includes("src/routes/contact")) {
            return "route-contact";
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true,
  },
});
