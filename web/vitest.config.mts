import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: {
    src: fileURLToPath(new URL("./src", import.meta.url)),
    "#q-app/wrappers": fileURLToPath(new URL("./tests/wrappers.ts", import.meta.url)),
  } },
  test: { environment: "node", include: ["tests/**/*.spec.ts"], pool: "threads", setupFiles: ["./tests/setup.ts"] },
});
