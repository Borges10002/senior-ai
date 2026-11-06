import { beforeEach, vi } from "vitest";
const values = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => values.get(k) ?? null,
  setItem: (k: string, v: string) => { values.set(k, String(v)); },
  removeItem: (k: string) => { values.delete(k); },
  clear: () => values.clear(),
});
vi.stubGlobal("window", { location: { pathname: "/login", assign: vi.fn() } });
beforeEach(() => { values.clear(); vi.clearAllMocks(); });
