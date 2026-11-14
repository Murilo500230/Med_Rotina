// Doses do dia e histórico (API: T11 doses diárias e T18 histórico)
import { chamarApi } from '@/services/http';

export type StatusApi = 'pendente' | 'tomada' | 'atrasada';

export type DoseApi = {
  id: number;
  medicamento_id: number | null;
  nome_medicamento: string;
  dosagem: string;
  data: string; // AAAA-MM-DD
  horario: string; // HH:MM:SS
  status: StatusApi;
  tomada_em: string | null; // ISO em UTC
};

export type PainelHoje = {
  data: string;
  fuso: string;
  doses: DoseApi[];
};

export type DiaHistorico = {
  data: string;
  total: number;
  tomadas: number;
  atrasadas: number;
  pendentes: number;
  adesao: number | null; // % das doses vencidas que foram tomadas
  doses: DoseApi[];
};

export type Historico = {
  dias: number;
  fuso: string;
  resumo: { tomadas: number; vencidas: number; adesao: number | null };
  historico: DiaHistorico[];
};

// A listagem não gera doses sozinha: o app pede a geração do dia antes de listar.
export async function carregarHoje(token: string) {
  await chamarApi('POST', '/doses/gerar', token);
  return chamarApi<PainelHoje>('GET', '/doses/hoje', token);
}

export function tomarDose(id: number, token: string) {
  return chamarApi<{ id: number; status: StatusApi; tomada_em: string | null }>(
    'PATCH',
    `/doses/${id}/tomar`,
    token,
  );
}

export function carregarHistorico(token: string, dias: number) {
  return chamarApi<Historico>('GET', `/historico?dias=${dias}`, token);
}
