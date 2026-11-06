import { restoreSession } from "src/boot/axios";
import { sessionUser } from "src/services/session";
import { usePerfil } from "src/composables/usePerfil";

export async function authorizeRoute(to: {
  path: string;
  matched: Array<{ meta: { requiresAuth?: unknown; requiresAdmin?: unknown } }>;
}): Promise<string | true> {
  await restoreSession();
  const authenticated = !!sessionUser.value;
  if (to.matched.some(r => r.meta.requiresAuth || r.meta.requiresAdmin) && !authenticated) return "/login";
  if (to.path === "/login" && authenticated) return "/app/dashboard";
  if (to.matched.some(r => r.meta.requiresAdmin)) {
    const perfil = await usePerfil().carregar();
    if (!perfil?.admin) return "/app/dashboard";
  }
  return true;
}
