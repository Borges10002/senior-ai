import { carregarSessao, salvarSessao, limparSessao } from '@/infra/storage/session-storage';
import type { Sessao } from '@/domain/models';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-secure-store', () => ({}));
const sessao: Sessao = { token: 'token', refreshToken: 'refresh', user: {
  codigo: 1, nivelAcesso: 1, nome: 'Teste', nomeAbreviado: 'T', email: 't@example.com', usuario: 't',
} };
test('remove tokens legados do navegador e mantém sessão apenas em memória', async () => {
  const removeItem = jest.fn();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { removeItem } });
  await salvarSessao(sessao);
  await expect(carregarSessao()).resolves.toEqual(sessao);
  expect(removeItem).toHaveBeenCalledWith('seniorai.sessao');
  await limparSessao();
  await expect(carregarSessao()).resolves.toBeNull();
});
