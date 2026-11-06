export function getDataTimeAtual(): Date {
  const now = new Date();
  now.setHours(now.getUTCHours() - 4);
  return now;
};

export function getPrimeiroDiaMes(): Date {
  let hoje = getDataTimeAtual();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

function adicionarDias(qtdDias: number) {
  let hoje = getDataTimeAtual();
  hoje.setDate(hoje.getDate() + qtdDias);
  return hoje;
}

function adicionarMinutos(data: Date, minutos: number): Date {
  const novaData = new Date(data);
  novaData.setMinutes(novaData.getMinutes() + minutos);
  return novaData;
}

export const getInicioAndFimDia = (date: Date): { inicioDia: Date; fimDia: Date } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const inicioDia = new Date(year, month, day, 0, 0, 0, 0);
  const fimDia = new Date(year, month, day, 23, 59, 59, 999);

  return { inicioDia, fimDia };
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default () => ({
  getDataTimeAtual,
  getPrimeiroDiaMes,
  adicionarMinutos,
  adicionarDias,
  getInicioAndFimDia,
  formatDate
});
