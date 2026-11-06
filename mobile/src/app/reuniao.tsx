import { router } from "expo-router";
import { useState } from "react";

import { reuniaoService } from "@/infra/api/services";
import { Botao, Campo, Tela, Texto } from "@/ui/components/base";
import { useTema } from "@/ui/theme";

export default function NovaReuniaoScreen() {
  const { cores } = useTema();
  const [titulo, setTitulo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!titulo.trim()) {
      setErro("Informe o título da reunião.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await reuniaoService.criar({ titulo: titulo.trim(), assunto: assunto.trim() || null });
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar a reunião.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} />
      <Campo rotulo="Assunto" value={assunto} onChangeText={setAssunto} />
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}
      <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
    </Tela>
  );
}
