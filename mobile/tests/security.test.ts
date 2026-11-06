import { lerVersaoApp } from '@/domain/versao';
import { urlApkSegura, urlHttpsSegura } from '@/domain/seguranca';
import { configurarSessao, request, ApiError } from '@/infra/api/http-client';
import type { Sessao } from '@/domain/models';

const sessao: Sessao = { token: 'token', refreshToken: 'refresh', user: {
  codigo: 1, nivelAcesso: 1, nome: 'Teste', nomeAbreviado: 'T', email: 't@example.com', usuario: 't',
} };
const resposta = (status: number, body: unknown = {}) => ({
  status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(body),
} as Response);
let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  configurarSessao({ get: () => sessao, refresh: async () => null, onExpired: jest.fn() });
});

test.each(['javascript:alert(1)', 'http://example.com', 'https://u:p@example.com', 'invalido'])('bloqueia URL insegura %s', valor => {
  expect(urlHttpsSegura(valor)).toBeNull();
});
test('aceita somente o APK publicado pelo projeto e versão sem caminhos', () => {
  const url = 'https://download.dimitech.com.br/seniorai/seniorai.apk?v=1.2.0';
  expect(urlApkSegura(url)).toBe(true);
  expect(lerVersaoApp({ versao: '1.2.0', url })?.versao).toBe('1.2.0');
  expect(lerVersaoApp({ versao: '../../1', url })).toBeNull();
  for (const url of ['https://evil.example/app.apk', 'https://download.dimitech.com.br.evil.example/seniorai/seniorai.apk']) {
    expect(lerVersaoApp({ versao: '1.2.0', url })).toBeNull();
  }
});
test('bloqueia requisição privada sem sessão antes de chamar a rede', async () => {
  configurarSessao({ get: () => null, refresh: async () => null, onExpired: jest.fn() });
  await expect(request('/reunioes')).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
test('requisições públicas nunca recebem o token de acesso', async () => {
  fetchMock.mockResolvedValue(resposta(200));
  await request('/sessions', { publica: true });
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
});
test('resposta 500 não revela detalhes internos do servidor', async () => {
  fetchMock.mockResolvedValue(resposta(500, { message: 'SQL password=segredo' }));
  await expect(request('/reunioes')).rejects.toThrow('O servidor está indisponível');
});
test('renova uma vez e expira sessão se o novo token também recebe 401', async () => {
  const onExpired = jest.fn();
  const nova = { ...sessao, token: 'novo' };
  let atual = sessao;
  const refresh = jest.fn(async () => { atual = nova; return nova; });
  configurarSessao({ get: () => atual, refresh, onExpired });
  fetchMock.mockResolvedValue(resposta(401));
  await expect(request('/reunioes')).rejects.toBeInstanceOf(ApiError);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(onExpired).toHaveBeenCalledTimes(1);
});
test.each(['//evil.example', 'https://evil.example', '/clientes\r\nX-Test:1', '/foo\\bar'])('bloqueia caminho malformado %s', async path => {
  await expect(request(path)).rejects.toThrow('Caminho de API inválido');
  expect(fetchMock).not.toHaveBeenCalled();
});
test('resposta da conta anterior é descartada depois de trocar de usuário', async () => {
  let atual: Sessao | null = sessao;
  configurarSessao({ get: () => atual, refresh: async () => null, onExpired: jest.fn() });
  fetchMock.mockImplementation(async () => {
    atual = { ...sessao, user: { ...sessao.user, codigo: 2 } };
    return resposta(200, [{ nome: 'Dados da conta anterior' }]);
  });
  await expect(request('/reunioes')).rejects.toMatchObject({ status: 401 });
});
test('interrompe requisição sem resposta após 30 segundos', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('abort')));
  }));
  const resultado = expect(request('/reunioes')).rejects.toMatchObject({ status: 0 });
  await jest.advanceTimersByTimeAsync(30_000);
  await resultado;
  jest.useRealTimers();
});
