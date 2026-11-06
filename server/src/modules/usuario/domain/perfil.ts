import nivelacessoConstants from "@/constants/nivelacesso.constants";

export type Perfil = (typeof nivelacessoConstants)[keyof typeof nivelacessoConstants];

export const PERFIS: Perfil[] = Object.values(nivelacessoConstants).sort(
  (a, b) => a.level - b.level,
);

/** Perfil a partir do valor gravado (level numérico ou id "U"/"G"/"A"). */
export function perfilDoNivel(nivel: unknown): Perfil {
  return (
    PERFIS.find((p) => p.level === Number(nivel) || p.id === nivel) ??
    nivelacessoConstants.USUARIO
  );
}

export function ehAdministrador(nivel: unknown): boolean {
  return perfilDoNivel(nivel).level >= nivelacessoConstants.ADMINISTRADOR.level;
}

/** Dados de perfil expostos ao frontend. */
export function resumoPerfil(nivel: unknown) {
  const perfil = perfilDoNivel(nivel);
  return {
    nivel: perfil.level,
    nome: perfil.nome,
    admin: ehAdministrador(perfil.level),
  };
}
