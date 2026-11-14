// Chamadas autenticadas à API (token JWT no cabeçalho)
import { API_URL, ApiError } from '@/services/api';

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function chamarApi<T>(
  metodo: Metodo,
  caminho: string,
  token: string,
  corpo?: unknown,
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const e = (dados ?? {}) as { erro?: string; mensagem?: string; message?: string };
    throw new ApiError(e.erro ?? e.mensagem ?? e.message ?? 'Ocorreu um erro. Tente novamente.', resposta.status);
  }
  return dados as T;
}
