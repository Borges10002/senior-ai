import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/LoginLayout.vue"),
    children: [
      { path: "", redirect: "/login" },
      {
        path: "login",
        name: "login",
        component: () => import("src/pages/login/Login.vue"),
      },
      {
        // Link do e-mail "Esqueci minha senha" (público).
        path: "redefinir-senha",
        name: "redefinir-senha",
        component: () => import("src/pages/login/RedefinirSenha.vue"),
      },
    ],
  },
  {
    path: "/app",
    component: () => import("layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/app/dashboard" },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("pages/Dashboard.vue"),
      },
      {
        path: "reunioes",
        name: "reunioes",
        component: () => import("src/pages/Reunioes.vue"),
      },
      {
        path: "admin",
        name: "admin",
        meta: { requiresAdmin: true },
        component: () => import("src/pages/admin/PainelAdmin.vue"),
      },
      {
        path: "admin/vendas",
        name: "admin-vendas",
        meta: { requiresAdmin: true },
        component: () => import("src/pages/admin/Vendas.vue"),
      },
      {
        path: "admin/usuarios",
        name: "admin-usuarios",
        meta: { requiresAdmin: true },
        component: () => import("src/pages/admin/Usuarios.vue"),
      },
      {
        path: "admin/feedbacks",
        name: "admin-feedbacks",
        meta: { requiresAdmin: true },
        component: () => import("src/pages/admin/Feedbacks.vue"),
      },
      {
        path: "meus-feedbacks",
        name: "meus-feedbacks",
        component: () => import("src/pages/MeusFeedbacks.vue"),
      },
      {
        path: "assinatura",
        name: "assinatura",
        component: () => import("src/pages/Assinatura.vue"),
      },
      {
        path: "configuracoes/alterar-senha",
        name: "configuracoes-alterar-senha",
        component: () => import("src/pages/ConfiguracoesAlterarSenha.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
