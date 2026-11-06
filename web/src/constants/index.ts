export const API_BASE_URL = 'http://localhost:3000';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user'
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/app/dashboard',
  REUNIOES: '/app/reunioes'
} as const;

export const CATEGORIA_TIPOS = ['Receita', 'Despesa'] as const;