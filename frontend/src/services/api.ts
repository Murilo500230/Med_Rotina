// Cliente HTTP do MedRotina. Concentra a URL base e os endpoints da API (T3/T4).
// Em dispositivo físico, "localhost" não funciona: defina EXPO_PUBLIC_API_URL
// em frontend/.env com o endereço da máquina/Codespace que roda o back-end.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Se a equipe de back-end usar outros caminhos, basta ajustar aqui.
export const ENDPOINTS = {
  register: '/register',
  login: '/login',
} as const;

export type Usuario = {
  id: number;
  nome: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  usuario: Usuario;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagem =
      (dados as { message?: string; error?: string }).message ??
      (dados as { error?: string }).error ??
      'Ocorreu um erro. Tente novamente.';
    throw new ApiError(mensagem, resposta.status);
  }
  return dados as T;
}

export function cadastrar(nome: string, email: string, senha: string) {
  return request<Partial<AuthResponse>>(ENDPOINTS.register, { nome, email, senha });
}

export function entrar(email: string, senha: string) {
  return request<AuthResponse>(ENDPOINTS.login, { email, senha });
}
