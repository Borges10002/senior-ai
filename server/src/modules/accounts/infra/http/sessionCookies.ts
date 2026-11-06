import { Request, Response } from "express";
import corsConfig from "@config/cors.config";
import AppError from "@shared/errors/AppError";
export const COOKIE_ACCESS = "sa_access";
export const COOKIE_REFRESH = "sa_refresh";
export function cookie(req: Request, name: string): string | undefined {
  const value = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  if (!value) return undefined;
  try { return decodeURIComponent(value.slice(name.length + 1)); } catch { return undefined; }
}
export function ensureCookieOrigin(req: Request) {
  const origin = req.headers.origin;
  if (!origin || !corsConfig.origens.includes(origin)) throw new AppError("Origem nao autorizada", 403);
}
const options = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax", path: "/" });
export function clearSessionCookies(res: Response) {
  res.clearCookie(COOKIE_ACCESS, options());
  res.clearCookie(COOKIE_REFRESH, { ...options(), path: "/sessions" });
}
export function sessionResponse(req: Request, res: Response, result: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.headers["x-auth-mode"] !== "cookie") return res.json(result);
  ensureCookieOrigin(req);
  // Session cookies: JWT/database expiration is authoritative. No tokens in the JS response.
  res.cookie(COOKIE_ACCESS, result.token, options());
  res.cookie(COOKIE_REFRESH, result.refreshToken, { ...options(), path: "/sessions" });
  return res.json({ user: result.user });
}
