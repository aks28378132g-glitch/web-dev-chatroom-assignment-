import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:8080",
        ws: true
      }
    }
  }
});
