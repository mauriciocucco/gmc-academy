import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    {
      // Silently handle Chrome DevTools well-known probe requests
      // to prevent React Router SSR from throwing 404 errors in dev.
      name: "handle-well-known",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/.well-known/")) {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
