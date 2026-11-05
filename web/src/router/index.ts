import { defineRouter } from "#q-app/wrappers";
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { restaurarSessao } from "src/boot/axios";
import { sessionUser } from "src/services/session";
import routes from "./routes";

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    await restaurarSessao();
    const autenticado = !!sessionUser.value;
    if (to.matched.some((r) => r.meta.requiresAuth) && !autenticado) return "/login";
    if (to.path === "/login" && autenticado) return "/app";
    return true;
  });

  return Router;
});
