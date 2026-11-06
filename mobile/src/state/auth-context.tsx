import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Sessao, Usuario } from "@/domain/models";
import { configurarSessao } from "@/infra/api/http-client";
import { authService } from "@/infra/api/services";
import {
  carregarSessao,
  limparSessao,
  salvarSessao,
} from "@/infra/storage/session-storage";

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const sessaoRef = useRef<Sessao | null>(null);
  const renovacaoRef = useRef<Promise<Sessao | null> | null>(null);
  const persistenciaRef = useRef<Promise<void>>(Promise.resolve());

  const aplicar = useCallback(async (nova: Sessao | null) => {
    sessaoRef.current = nova;
    setSessao(nova);
    // Mantém a ordem: uma gravação pendente nunca pode terminar depois da limpeza do logout.
    const persistencia = persistenciaRef.current.catch(() => undefined)
      .then(() => nova ? salvarSessao(nova) : limparSessao());
    persistenciaRef.current = persistencia;
    await persistencia;
  }, []);

  useEffect(() => {
    configurarSessao({
      get: () => sessaoRef.current,
      // Várias requisições podem receber 401 juntas; todas aguardam a mesma renovação.
      refresh: () => {
        const atual = sessaoRef.current;
        if (!atual?.refreshToken) return Promise.resolve(null);
        renovacaoRef.current ??= authService
          .renovar(atual.refreshToken)
          .then(async (nova) => {
            // Logout ou troca de conta invalidam a renovação em andamento.
            if (sessaoRef.current !== atual) return null;
            await aplicar(nova);
            return nova;
          })
          .catch(() => null)
          .finally(() => {
            renovacaoRef.current = null;
          });
        return renovacaoRef.current;
      },
      onExpired: () => {
        void aplicar(null).catch(() => undefined);
      },
    });

    carregarSessao().then((salva) => {
      sessaoRef.current = salva;
      setSessao(salva);
      setCarregando(false);
    });
  }, [aplicar]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      await aplicar(await authService.entrar(email, senha));
    },
    [aplicar],
  );

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) => {
      await authService.cadastrar(nome, email, senha);
      await entrar(email, senha);
    },
    [entrar],
  );

  const sair = useCallback(() => aplicar(null), [aplicar]);

  const valor = useMemo(
    () => ({ usuario: sessao?.user ?? null, carregando, entrar, cadastrar, sair }),
    [sessao, carregando, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
