// Cuidadores do usuário (API: T13). O back-end isola os dados pelo token JWT.
import { chamarApi } from '@/services/http';

export type Cuidador = {
  id: number;
  nome: string;
  contato: string; // e-mail ou telefone
};

export type DadosCuidador = {
  nome: string;
  contato: string;
};

export function listarCuidadores(token: string) {
  return chamarApi<Cuidador[]>('GET', '/cuidadores', token);
}

export function cadastrarCuidador(dados: DadosCuidador, token: string) {
  return chamarApi<Cuidador>('POST', '/cuidadores', token, dados);
}

export function atualizarCuidador(id: number, dados: DadosCuidador, token: string) {
  return chamarApi<Cuidador>('PUT', `/cuidadores/${id}`, token, dados);
}

export async function excluirCuidador(id: number, token: string) {
  await chamarApi<null>('DELETE', `/cuidadores/${id}`, token);
}
