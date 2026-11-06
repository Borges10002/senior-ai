import { sessionUser } from "src/services/session";
import { computed, ref } from "vue";

import { api } from "src/boot/axios";

export interface Perfil {
  nivel: number;
  nome: string;
  admin: boolean;
}

// Estado global: o perfil do usuário logado. O backend confere o perfil no
// banco a cada requisição de /admin; aqui ele só decide o que mostrar.
const perfil = ref<Perfil | null>(lerDoArmazenamento());
const codigoUsuario = ref<number | null>(lerCodigo());
let carregamento: Promise<Perfil | null> | null = null;

function lerUsuarioSalvo(): Record<string, any> | null {
  return sessionUser.value;
}

function lerDoArmazenamento(): Perfil | null {
  return lerUsuarioSalvo()?.perfil ?? null;
}

function lerCodigo(): number | null {
  const codigo = Number(lerUsuarioSalvo()?.codigo);
  return Number.isFinite(codigo) && codigo > 0 ? codigo : null;
}

function salvarNoUsuario(novo: Perfil) {
  const usuario = lerUsuarioSalvo();
  if (usuario) sessionUser.value = { ...usuario, perfil: novo };
}

/** Busca o perfil atual no servidor (promoções valem sem novo login). */
function carregar(): Promise<Perfil | null> {
  if (!sessionUser.value) {
    limpar();
    return Promise.resolve(null);
  }
  const codigoSolicitado = Number(sessionUser.value.codigo);
  carregamento ??= api
    .get("/usuarios")
    .then(({ data }) => {
      if (Number(sessionUser.value?.codigo) !== codigoSolicitado) return null;
      perfil.value = data?.perfil ?? null;
      codigoUsuario.value = Number(data?.codigo) || null;
      if (perfil.value) salvarNoUsuario(perfil.value);
      return perfil.value;
    })
    .catch(() => { limpar(); return null; })
    .finally(() => {
      carregamento = null;
    });
  return carregamento;
}

function limpar() {
  perfil.value = null;
  codigoUsuario.value = null;
}

/** Usado após o login, que já traz o perfil na resposta. */
function definir(novo: Perfil | null, codigo?: number) {
  perfil.value = novo;
  if (codigo !== undefined) codigoUsuario.value = codigo;
}

export function usePerfil() {
  return {
    perfil: computed(() => perfil.value),
    codigoUsuario: computed(() => codigoUsuario.value),
    isAdmin: computed(() => perfil.value?.admin === true),
    nomePerfil: computed(() => perfil.value?.nome ?? "Usuário"),
    carregar,
    limpar,
    definir,
  };
}
