/** URLs externas nunca podem carregar credenciais ou executar esquemas locais. */
export function urlHttpsSegura(valor: string): URL | null {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function urlApkSegura(valor: string): boolean {
  const url = urlHttpsSegura(valor);
  return !!url && url.origin === "https://download.dimitech.com.br" && url.pathname === "/seniorai/seniorai.apk";
}
