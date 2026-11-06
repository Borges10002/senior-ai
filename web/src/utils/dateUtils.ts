type IFormatDate =
    | "dd/mm/yyyy"
    | "mm/dd/yyyy"
    | "yyyy-mm-dd"
    | "yyyy/mm/dd"
    | "dd/mm/yyyy HH:mm"
    | "mm/dd/yyyy HH:mm"
    | "yyyy-mm-dd HH:mm";

function formatDateString(dateString: string) {
    return formatDate(dateString, "dd/mm/yyyy")
}

function formatDateHours(dateString: string) {
    return formatDate(dateString, "dd/mm/yyyy HH:mm")
}

function formatDateQuasar(dateString: string) {
    return formatDate(dateString, "yyyy/mm/dd")
}

function formatDate(dateString: string | undefined, format: IFormatDate) {
  if (!dateString) return "";

  let date: Date;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
    const [day = 1, month = 1, year = 1970] = dateString.split(/[\/\s:]/).map(Number);
    date = new Date(year, month - 1, day);
    if (dateString.includes(":")) {
      const [, , , hours, minutes] = dateString.split(/[\/\s:]/).map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);
    }
  } else {
    date = new Date(dateString);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  switch (format) {
    case "dd/mm/yyyy":
      return `${day}/${month}/${year}`;
    case "mm/dd/yyyy":
      return `${month}/${day}/${year}`;
    case "yyyy-mm-dd":
      return `${year}-${month}-${day}`;
    case "yyyy/mm/dd":
      return `${year}/${month}/${day}`;
    case "dd/mm/yyyy HH:mm":
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case "mm/dd/yyyy HH:mm":
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    case "yyyy-mm-dd HH:mm":
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function getPrimeiroDiaMes(): Date {
  let hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

function adicionarDiasHoje(qtdDias: number) {
  let hoje = new Date();
  return adicionarDias(hoje, qtdDias);
}

function adicionarDias(data: Date, qtdDias: number) {
  data.setDate(data.getDate() + (qtdDias));
  return data;
}

function formatDisplayDate(dateString: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export default () => ({
  formatDate,
  formatDateHours,
  formatDateQuasar,
  formatDateString,
  getPrimeiroDiaMes,
  adicionarDias,
  adicionarDiasHoje,
  formatDisplayDate
});
