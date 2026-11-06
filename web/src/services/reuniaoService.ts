import { api } from "src/boot/axios";
import type { Reuniao } from "src/domain/models";

export interface NovaReuniao {
  titulo: string;
  assunto?: string | null;
  inicio_previsto?: string | null;
  fim_previsto?: string | null;
}

export type AcaoReuniao = "iniciar" | "finalizar" | "cancelar";

export const reuniaoService = {
  async listar(): Promise<Reuniao[]> {
    return (await api.get<Reuniao[]>("/reunioes")).data;
  },
  async criar(dados: NovaReuniao): Promise<Reuniao> {
    return (await api.post<Reuniao>("/reunioes", dados)).data;
  },
  async mudarStatus(id: string, acao: AcaoReuniao): Promise<Reuniao> {
    return (await api.post<Reuniao>(`/reunioes/${id}/${acao}`)).data;
  },
  async excluir(id: string): Promise<void> {
    await api.delete(`/reunioes/${id}`);
  },
};
