// https://v2.quasar.dev/quasar-cli-webpack/quasar-config-file
import { defineConfig } from "#q-app/wrappers";

export default defineConfig(() => {
  return {
    boot: ["axios"],
    css: ["app.scss"],
    extras: ["roboto-font", "material-icons"],

    build: {
      distDir: "dist/spa",
      vueRouterMode: "history",
      // URL da API: API_URL no ambiente de build ou em web/.env.local.
      env: { API_URL: process.env.API_URL || "http://localhost:3333/api/v1" },
      esbuildTarget: {
        browser: ["es2022", "firefox115", "chrome115", "safari14"],
        node: "node20",
      },
      typescript: {
        strict: true,
        vueShim: true,
      },
    },

    devServer: {
      server: { type: "http" },
      port: 9000,
      open: true,
      historyApiFallback: true,
      static: { directory: "public", serveIndex: false },
    },

    framework: {
      config: {},
      lang: "pt-BR",
      plugins: ["Notify", "Dialog"],
    },

    animations: [],
  };
});
