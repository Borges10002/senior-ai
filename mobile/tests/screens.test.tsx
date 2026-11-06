import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { useAuth } from '@/state/auth-context';
import { useLocalSearchParams } from 'expo-router';
import { assinaturaService } from '@/infra/api/services';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
}));
jest.mock('expo-router/stack', () => ({ __esModule: true, default: { Screen: () => null } }));
jest.mock('@/state/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/infra/api/services', () => ({
  authService: { esqueciSenha: jest.fn(), alterarSenha: jest.fn() },
  reuniaoService: { listar: async () => [], criar: jest.fn(), mudarStatus: jest.fn() },
  assinaturaService: { minha: jest.fn() },
  adminService: { vendas: async () => { throw new Error('Acesso negado'); } },
}));

const casos = [
  ['entrar', 'Senior AI'], ['alterar-senha', 'Alterar senha'],
  ['reuniao', 'Título'], ['assinatura', 'Falha ao carregar plano'], ['vendas', 'Acesso negado'],
  ['(tabs)/index', 'Visão geral'], ['(tabs)/reunioes', 'Reuniões'], ['(tabs)/mais', 'Mais'],
] as const;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(useAuth).mockReturnValue({ usuario: {
    codigo: 1, usuario: 'teste', nome: 'Pessoa Teste', email: 'teste@example.com', nomeAbreviado: 'PT', nivelAcesso: 1,
  }, carregando: false, entrar: jest.fn(), cadastrar: jest.fn(), sair: jest.fn() });
  jest.mocked(assinaturaService.minha).mockRejectedValue(new Error('Falha ao carregar plano'));
});

test.each(casos)('tela %s renderiza com dados vazios/erro de serviço', async (rota, texto) => {
  const Componente = require(`../src/app/${rota}`).default;
  const resultado = await render(<Componente />);
  expect(resultado.toJSON()).not.toBeNull();
  if (texto) expect(await screen.findAllByText(texto, { exact: false })).not.toHaveLength(0);
});

test('toda tela do diretório de rotas está incluída na matriz', () => {
  const raiz = join(__dirname, '../src/app');
  const rotas = readdirSync(raiz, { recursive: true }).map(String)
    .filter(p => p.endsWith('.tsx') && !p.endsWith('_layout.tsx'))
    .map(p => p.replaceAll('\\', '/').replace(/\.tsx$/, '')).sort();
  expect(casos.map(([rota]) => rota).sort()).toEqual(rotas);
});

test('login vazio não envia credenciais', async () => {
  const Componente = require('../src/app/entrar').default;
  await render(<Componente />);
  await fireEvent.press(screen.getAllByText('Entrar').at(-1)!);
  expect(await screen.findByText('Informe um e-mail válido.')).toBeTruthy();
  expect(useAuth().entrar).not.toHaveBeenCalled();
});

test('reunião sem título não é enviada', async () => {
  const { reuniaoService } = require('@/infra/api/services');
  const Componente = require('../src/app/reuniao').default;
  await render(<Componente />);
  await fireEvent.press(screen.getByText('Salvar'));
  expect(await screen.findByText('Informe o título da reunião.')).toBeTruthy();
  expect(reuniaoService.criar).not.toHaveBeenCalled();
});
