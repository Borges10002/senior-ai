import { describe, expect, it } from "vitest";
import { decidirAgendamento, proximoHorarioLivre } from "./agendamento";

const agora = new Date("2026-11-05T12:00:00Z");
const d = (h: string) => new Date(`2026-11-10T${h}:00Z`);
const ocupado = (de: string, ate: string) => ({ inicio: d(de), fim: d(ate) });
const pedido = (inicio: string | null, duracaoMin: number | null = 60) => ({ inicio, duracaoMin });

describe("decisão de agendamento", () => {
  it("cria quando o horário está livre, com 60 min por padrão", () => {
    const r = decidirAgendamento(pedido("2026-11-10T15:00:00Z", null), [], agora);
    expect(r).toEqual({ status: "CRIADO", periodo: { inicio: d("15:00"), fim: d("16:00") } });
  });

  it("não sobrepõe compromisso e sugere o próximo horário livre", () => {
    const r = decidirAgendamento(pedido("2026-11-10T15:00:00Z"), [ocupado("15:30", "16:30")], agora);
    expect(r).toMatchObject({ status: "CONFLITO", sugestao: d("16:30") });
  });

  it("encostar no fim de outro compromisso não é conflito", () => {
    expect(decidirAgendamento(pedido("2026-11-10T15:00:00Z"), [ocupado("14:00", "15:00")], agora).status).toBe("CRIADO");
  });

  it("sem hora definida não agenda", () => {
    expect(decidirAgendamento(pedido(null), [], agora).status).toBe("SEM_HORARIO");
  });

  it("recusa data inválida, no passado ou absurda", () => {
    expect(decidirAgendamento(pedido("terça"), [], agora).status).toBe("DATA_INVALIDA");
    expect(decidirAgendamento(pedido("2026-11-01T15:00:00Z"), [], agora).status).toBe("DATA_INVALIDA");
    expect(decidirAgendamento(pedido("2031-01-01T15:00:00Z"), [], agora).status).toBe("DATA_INVALIDA");
  });

  it("ignora duração sem sentido", () => {
    const r = decidirAgendamento(pedido("2026-11-10T15:00:00Z", -5), [], agora);
    expect(r).toMatchObject({ periodo: { fim: d("16:00") } });
  });
});

describe("próximo horário livre", () => {
  it("pula compromissos em sequência", () => {
    const livre = proximoHorarioLivre(ocupado("10:00", "11:00"), [ocupado("11:00", "12:00"), ocupado("09:30", "11:00")]);
    expect(livre).toEqual(d("12:00"));
  });

  it("usa a brecha quando a duração cabe", () => {
    const livre = proximoHorarioLivre(ocupado("10:00", "11:00"), [ocupado("10:30", "11:00"), ocupado("12:00", "13:00")]);
    expect(livre).toEqual(d("11:00"));
  });
});
