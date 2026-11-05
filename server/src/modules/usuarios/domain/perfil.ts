export const PERFIS = ["proprietario", "administrador", "participante", "convidado"] as const;
export type Perfil = (typeof PERFIS)[number];
