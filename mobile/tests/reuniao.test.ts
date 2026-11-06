import type { Reuniao } from '@/domain/models';
import { contarPorStatus, formatarDataHora, proximasReunioes } from '@/domain/reuniao';

const reuniao = (id: string, status: Reuniao['status'], inicio_previsto: string | null): Reuniao => ({
  id, titulo: id, assunto: null, objetivo: null, local: null, status, inicio_previsto,
  fim_previsto: null, iniciada_em: null, finalizada_em: null,
});

test('formata data ausente', () => {
  expect(formatarDataHora(null)).toBe('Sem horário');
});

test('conta por status', () => {
  expect(contarPorStatus([reuniao('a', 'AGENDADA', null), reuniao('b', 'FINALIZADA', null)], 'AGENDADA')).toBe(1);
});

test('próximas reuniões vêm em ordem, só agendadas e as sem horário por último', () => {
  const lista = [
    reuniao('sem', 'AGENDADA', null),
    reuniao('depois', 'AGENDADA', '2026-11-10T10:00:00Z'),
    reuniao('antes', 'AGENDADA', '2026-11-06T10:00:00Z'),
    reuniao('fim', 'FINALIZADA', '2026-11-01T10:00:00Z'),
  ];
  expect(proximasReunioes(lista).map((r) => r.id)).toEqual(['antes', 'depois', 'sem']);
});
