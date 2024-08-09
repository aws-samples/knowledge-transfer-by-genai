import path from "path";
import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [TanStackRouterVite(), viteReact()],
    server: { open: true },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
