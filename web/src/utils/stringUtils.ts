function formatSimNao(word: string | undefined): string {
  switch (word) {
    case "S":
      return "Sim";
    case "N":
      return "Não";
    default:
      return "";
  }
}

function formatArrayStringPadraoBR(array: string[]): string {
  const wordString = [];

  if (array.length == 1) {
    return array[0]!;
  }

  for (let i = 0; i < array.length - 1; i++) {
    wordString.push(array[i]);
  }

  return wordString.join(", ") + " e " + array[array.length - 1] + ".";
}

function truncarString(str: string, limite: number) {
  if (str.length > limite) {
    return str.substring(0, limite) + '...';
  }
  return str;
}

export default () => ({
  formatSimNao,
  formatArrayStringPadraoBR,
  truncarString
});
