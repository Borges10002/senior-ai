const formatCurrencyBRL = (value: number): string =>{
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value).replace(/^R\$\s*/, '');
}

const formatCurrencyTakingSigrao = (currency: any) => {
  const number = Number(currency);
  if (isNaN(number)) return currency;
  const formatted = number.toLocaleString("pt-br", {
    style: "currency",
    currency: "BRL",
  });

  return formatted.replace("R$", "");
};

const formatCurrencySemSimbolo = (currency: any) => {
  const number = Number(currency);
  if (isNaN(number)) return currency;
  const formatted = number.toLocaleString("pt-br", {
    style: "decimal",
    currency: "BRL",
  });

  return formatted;
};

const formatter = (currency: any) => {
  const number = Number(currency);
  if (isNaN(number)) return currency;
  const formatted = number.toLocaleString("pt-br", {
    style: "currency",
    currency: "BRL",
  });

  return formatted;
};

export {
  formatCurrencyBRL,
  formatCurrencySemSimbolo,
  formatter,
  formatCurrencyTakingSigrao,
};
