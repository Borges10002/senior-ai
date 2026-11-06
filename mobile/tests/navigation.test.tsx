import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import RootLayout from '@/app/_layout';
import { useAuth } from '@/state/auth-context';

jest.mock('@/state/auth-context', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: jest.fn(),
}));
jest.mock('@/ui/components/splash-animada', () => ({ SplashAnimada: () => null }));
jest.mock('@/ui/components/aviso-atualizacao', () => ({ AvisoAtualizacao: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  DefaultTheme: { colors: {} }, DarkTheme: { colors: {} },
}));
// O teste inspeciona a configuração real de permissões; o navegador nativo é substituído.
jest.mock('expo-router/stack', () => {
  const { Text } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const Stack = ({ children }: { children: ReactNode }) => children;
  Stack.Protected = ({ guard, children }: { guard: boolean; children: ReactNode }) => guard ? children : null;
  Stack.Screen = ({ name }: { name: string }) => React.createElement(Text, {}, name);
  return { __esModule: true, default: Stack };
});

test.each([
  [null, ['entrar']],
  [1, ['(tabs)', 'reuniao', 'assinatura', 'alterar-senha']],
  [3, ['(tabs)', 'reuniao', 'assinatura', 'alterar-senha', 'vendas']],
] as const)('permissões de navegação para nível %s', async (nivel, permitidas) => {
  jest.mocked(useAuth).mockReturnValue({ usuario: nivel === null ? null : {
    codigo: 1, nivelAcesso: nivel, nome: 'Teste', nomeAbreviado: 'T', usuario: 't', email: 't@example.com',
  }, carregando: false, entrar: jest.fn(), cadastrar: jest.fn(), sair: jest.fn() });
  await render(<RootLayout />);
  for (const rota of ['entrar', '(tabs)', 'reuniao', 'assinatura', 'alterar-senha', 'vendas']) {
    expect(!!screen.queryByText(rota)).toBe((permitidas as readonly string[]).includes(rota));
  }
});
