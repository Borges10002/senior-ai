import * as SecureStore from 'expo-secure-store';
import { carregarSessao, salvarSessao, limparSessao } from '@/infra/storage/session-storage';
import type { Sessao } from '@/domain/models';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
}));
const sessao: Sessao = { token: 'token', refreshToken: 'refresh', user: {
  codigo: 1, nivelAcesso: 1, nome: 'Teste', nomeAbreviado: 'T', email: 't@example.com', usuario: 't',
} };
beforeEach(() => { jest.clearAllMocks(); });

test('restaura sessão válida do armazenamento nativo', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(sessao));
  await expect(carregarSessao()).resolves.toEqual(sessao);
});
test.each(['{}', 'null', '{"token":42}', 'json inválido'])('rejeita sessão corrompida %s', async bruto => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(bruto);
  await expect(carregarSessao()).resolves.toBeNull();
});
test('salva no dispositivo sem migração por backup e apaga no logout', async () => {
  await salvarSessao(sessao);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('seniorai.sessao', JSON.stringify(sessao), {
    keychainAccessible: 'device-only',
  });
  await limparSessao();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('seniorai.sessao');
});
