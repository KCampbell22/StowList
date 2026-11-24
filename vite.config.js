import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// npm run dev        → http   (works on any phone; the in-app camera scanner won't start)
// npm run dev:https  → https with a self-signed certificate. Phones only allow the
//                      camera on https pages; some browsers (often iPhone Safari)
//                      refuse self-signed certificates, though.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "https" ? [basicSsl()] : [])],
  // host: true lets you open the dev server from your phone on the same Wi-Fi.
  // Vite prints a "Network: http://192.168.x.x:5173" address on startup.
  server: { port: 5173, host: true },
}));
