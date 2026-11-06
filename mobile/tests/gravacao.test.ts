import { duracaoLegivel, estaProcessando, horarioDaFala, mimeDoVideo, tituloRapido, type Gravacao } from '@/domain/gravacao';

const gravacao = (status: Gravacao['status']): Gravacao => ({ id: 'g', status, erro: null, duracao_seg: null });

test('identifica o tipo do vídeo por plataforma', () => {
  expect(mimeDoVideo('file:///a/video.mov')).toBe('video/quicktime');
  expect(mimeDoVideo('file:///a/video.mp4')).toBe('video/mp4');
});

test('só para de atualizar quando terminou', () => {
  expect(estaProcessando([gravacao('TRANSCREVENDO')])).toBe(true);
  expect(estaProcessando([gravacao('CONCLUIDA'), gravacao('FALHOU')])).toBe(false);
  expect(estaProcessando([])).toBe(false);
});

test('formata duração e horário', () => {
  expect(duracaoLegivel(65)).toBe('01:05');
  expect(duracaoLegivel(3665)).toBe('1:01:05');
  expect(horarioDaFala(3665.7)).toBe('01:01:05');
});

test('título automático traz a data', () => {
  expect(tituloRapido(new Date(2026, 10, 5, 9, 30))).toContain('05/11/2026');
});
