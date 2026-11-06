import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/state/auth-context';
import { authService } from '@/infra/api/services';
import { configurarSessao } from '@/infra/api/http-client';
import { salvarSessao, limparSessao } from '@/infra/storage/session-storage';
import type { Sessao } from '@/domain/models';

jest.mock('@/infra/api/http-client', () => ({ configurarSessao: jest.fn() }));
jest.mock('@/infra/api/services', () => ({ authService: { renovar: jest.fn(), entrar: jest.fn() } }));
jest.mock('@/infra/storage/session-storage', () => ({
  carregarSessao: async () => ({ token: 'antigo', refreshToken: 'refresh', user: { codigo: 1, nivelAcesso: 1 } }),
  salvarSessao: jest.fn(), limparSessao: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());

test('renovação pendente não restaura sessão depois de sair', async () => {
  let resolver!: (s: Sessao) => void;
  jest.mocked(authService.renovar).mockReturnValue(new Promise(r => { resolver = r; }));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.carregando).toBe(false));
  const bridge = jest.mocked(configurarSessao).mock.calls.at(-1)![0];
  const renovacao = bridge.refresh();
  await act(async () => { await result.current.sair(); });
  await act(async () => { resolver({ token: 'novo', refreshToken: 'novo-refresh', user: { codigo: 1 } } as Sessao); await renovacao; });
  expect(result.current.usuario).toBeNull();
  expect(bridge.get()).toBeNull();
  expect(salvarSessao).not.toHaveBeenCalled();
  expect(limparSessao).toHaveBeenCalledTimes(1);
});
test('requisições simultâneas compartilham uma única renovação', async () => {
  let resolver!: (s: Sessao) => void;
  jest.mocked(authService.renovar).mockReturnValue(new Promise(r => { resolver = r; }));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.carregando).toBe(false));
  const bridge = jest.mocked(configurarSessao).mock.calls.at(-1)![0];
  const primeira = bridge.refresh();
  const segunda = bridge.refresh();
  expect(primeira).toBe(segunda);
  await act(async () => { resolver({ token: 'novo', refreshToken: 'r', user: { codigo: 1 } } as Sessao); await primeira; });
  expect(authService.renovar).toHaveBeenCalledTimes(1);
  expect(bridge.get()?.token).toBe('novo');
});
