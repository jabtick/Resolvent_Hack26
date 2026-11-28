// Standard TanStack Start setup (replaces Lovable's wrapper config).
// The Netlify plugin runs only for `npm run build`: it makes a site Netlify
// serves with SSR, so /u/<username> pages have real link previews. In dev it
// would try to start a Deno edge-functions emulator we don't need.
import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  server: { port: 8080 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
    ...(command === "build" ? [netlify()] : []),
  ],
}));
