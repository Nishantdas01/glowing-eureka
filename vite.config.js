import { defineConfig } from "vite";

const port = 5173;
const forwardedHost = process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  ? `${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : null;

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/glowing-eureka/" : "/",
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    ...(forwardedHost ? { allowedHosts: [forwardedHost] } : {}),
  },
});
