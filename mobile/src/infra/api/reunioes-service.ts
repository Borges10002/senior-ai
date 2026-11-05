import type { Reuniao } from "@/domain/models";
import { api } from "./http-client";

export const reunioesService = {
  listar: () => api<Reuniao[]>("/meetings"),
  criar: (titulo: string) => api<Reuniao>("/meetings", { method: "POST", body: JSON.stringify({ titulo }) }),
  iniciar: (id: string) => api<Reuniao>(`/meetings/${id}/start`, { method: "POST" }),
  finalizar: (id: string) => api<Reuniao>(`/meetings/${id}/finish`, { method: "POST" }),
};
