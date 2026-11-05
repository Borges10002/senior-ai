import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Usuario } from "@/domain/models";
import { configurarSessaoExpirada, login, logout } from "@/infra/api/http-client";
import { carregarSessao } from "@/infra/storage/session-storage";

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar(email: string, senha: string): Promise<void>;
  sair(): Promise<void>;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    configurarSessaoExpirada(() => setUsuario(null));
    carregarSessao()
      .then((s) => setUsuario(s?.usuario ?? null))
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    setUsuario((await login(email, senha)).usuario);
  }, []);

  const sair = useCallback(async () => {
    await logout();
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return valor;
}
