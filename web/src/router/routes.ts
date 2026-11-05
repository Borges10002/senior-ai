import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/LoginLayout.vue"),
    children: [
      { path: "", redirect: "/login" },
      { path: "login", name: "login", component: () => import("pages/login/Login.vue") },
    ],
  },
  {
    path: "/app",
    component: () => import("layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "dashboard", component: () => import("pages/Dashboard.vue") },
      { path: "reunioes", name: "reunioes", component: () => import("pages/reunioes/Reunioes.vue") },
    ],
  },
  { path: "/:catchAll(.*)*", component: () => import("pages/ErrorNotFound.vue") },
];

export default routes;
