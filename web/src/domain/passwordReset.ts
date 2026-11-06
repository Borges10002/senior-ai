export function readResetToken(query: unknown, hash: string): string {
  const fragment = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  const token = fragment || (typeof query === "string" ? query : "");
  return /^[a-f0-9]{64}$/.test(token) ? token : "";
}
