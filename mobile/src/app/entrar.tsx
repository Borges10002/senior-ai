import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { authService } from "@/infra/api/services";
import { useAuth } from "@/state/auth-context";
import {
  Botao,
  Campo,
  Icone,
  Segmentado,
  Tela,
  Texto,
} from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

type Modo = "entrar" | "cadastrar";

const SENHA_FORTE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export default function EntrarScreen() {
  const { entrar, cadastrar } = useAuth();
  const { cores } = useTema();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pedindoLink, setPedindoLink] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState<string | null>(null);

  /** Envia o link de troca de senha para o e-mail digitado (abre a página no navegador). */
  async function esqueciSenha() {
    setErro(null);
    setAvisoSenha(null);
    if (!/.+@.+\..+/.test(email.trim())) return setErro("Digite seu e-mail acima para receber o link.");
    setPedindoLink(true);
    try {
      setAvisoSenha((await authService.esqueciSenha(email)).message);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar o link.");
    } finally {
      setPedindoLink(false);
    }
  }

  async function enviar() {
    setErro(null);
    if (!email.includes("@")) return setErro("Informe um e-mail válido.");
    if (!senha) return setErro("Informe sua senha.");
    if (modo === "cadastrar") {
      if (!nome.trim()) return setErro("Informe seu nome.");
      if (!SENHA_FORTE.test(senha)) {
        return setErro(
          "A senha precisa ter 6+ caracteres, com letra, número e símbolo.",
        );
      }
    }

    setEnviando(true);
    try {
      if (modo === "entrar") await entrar(email, senha);
      else await cadastrar(nome, email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Tela>
        <View style={{ alignItems: "center", gap: espaco.md, marginTop: espaco.xxl }}>
          <Icone nome="wallet" cor={cores.sobrePrimaria} fundo={cores.primaria} tamanho={72} />
          <Texto variante="titulo">Senior AI</Texto>
          <Texto secundario style={{ textAlign: "center" }}>
            Suas contas, orçamentos e metas em um só lugar.
          </Texto>
        </View>

        <Segmentado
          opcoes={[
            { valor: "entrar", rotulo: "Entrar" },
            { valor: "cadastrar", rotulo: "Criar conta" },
          ]}
          valor={modo}
          onChange={(m) => {
            setModo(m);
            setErro(null);
          }}
        />

        <View style={{ gap: espaco.lg }}>
          {modo === "cadastrar" && (
            <Campo
              rotulo="Nome"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              textContentType="name"
              placeholder="Como devemos te chamar?"
            />
          )}
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="voce@email.com"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            textContentType={modo === "entrar" ? "password" : "newPassword"}
            placeholder="••••••••"
            onSubmitEditing={enviar}
            erro={erro}
          />
          <Botao
            titulo={modo === "entrar" ? "Entrar" : "Criar conta"}
            onPress={enviar}
            carregando={enviando}
          />
          {modo === "entrar" && (
            <Botao titulo="Esqueci minha senha" variante="texto" carregando={pedindoLink} onPress={esqueciSenha} />
          )}
          {avisoSenha && (
            <Texto variante="legenda" cor={cores.receita} style={{ textAlign: "center" }}>
              {avisoSenha}
            </Texto>
          )}
        </View>
      </Tela>
    </KeyboardAvoidingView>
  );
}
