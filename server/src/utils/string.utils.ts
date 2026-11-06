export function getNomeAbreviadoUsuario(nomeCompleto: string):string {
  const nomes = nomeCompleto.trim().split(/\s+/);
  if (nomes.length == 1) {
    return nomeCompleto;
  }
  if (nomes[1].length == 2 && nomes.length > 3) {
    nomes[1] = nomes[2];
  }
  const nomeFormated = nomes[0] + " " + nomes[1];
  return nomeFormated;
}

export default () => ({
  getNomeAbreviadoUsuario,
});
