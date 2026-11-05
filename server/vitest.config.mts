import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "node",
    // Threads em vez de processos: no Windows o fork falha às vezes (spawn UNKNOWN).
    pool: "threads",
    dir: "src",
    setupFiles: ["./src/shared/testes/setup.ts"],
  },
});
