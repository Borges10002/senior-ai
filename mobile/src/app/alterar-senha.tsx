import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { authService } from "@/infra/api/services";
import { Botao, Campo, Tela, Texto } from "@/ui/components/base";

const SENHA_FORTE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export default function AlterarSenhaScreen() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro(null);
    if (!atual) return setErro("Informe a senha atual.");
    if (!SENHA_FORTE.test(nova))
      return setErro("A nova senha precisa ter 6+ caracteres, com letra, número e símbolo.");
    if (nova !== confirmacao) return setErro("As senhas não conferem.");

    setSalvando(true);
    try {
      await authService.alterarSenha(atual, nova);
      Alert.alert("Pronto", "Sua senha foi alterada.");
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Texto secundario>Use uma senha forte, que você não usa em outros serviços.</Texto>
      <Campo rotulo="Senha atual" value={atual} onChangeText={setAtual} secureTextEntry textContentType="password" />
      <Campo rotulo="Nova senha" value={nova} onChangeText={setNova} secureTextEntry textContentType="newPassword" />
      <Campo
        rotulo="Confirmar nova senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        secureTextEntry
        textContentType="newPassword"
        erro={erro}
      />
      <Botao titulo="Alterar senha" icone="checkmark" onPress={salvar} carregando={salvando} />
    </Tela>
  );
}
