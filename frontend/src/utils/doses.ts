// Regras de apresentação das doses (relógio e status que aparecem na tela)
import type { DoseApi } from '@/services/doses';

// Mesmo prazo que o back-end usa para avisar o cuidador (ALERTA_TOLERANCIA_MINUTOS).
export const PRAZO_ATRASO_MIN = 30;

export type StatusTela = 'tomada' | 'pendente' | 'futura' | 'atrasada';

export function horarioCurto(horario: string) {
  return horario.slice(0, 5);
}

export function minutosDoDia(horario: string) {
  const [h, m] = horario.split(':');
  return Number(h) * 60 + Number(m);
}

// Minutos desde a meia-noite no fuso do servidor (cai para o relógio do aparelho se o Intl falhar)
export function agoraEmMinutos(fuso: string) {
  try {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuso,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const h = Number(partes.find((p) => p.type === 'hour')?.value);
    const m = Number(partes.find((p) => p.type === 'minute')?.value);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  } catch {
    // usa o relógio do aparelho
  }
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

// A API só diz pendente/atrasada/tomada. Na tela:
//  - futura: o horário ainda não chegou (a API não deixa marcar antes);
//  - pendente: já é hora de tomar, dentro do prazo;
//  - atrasada: passou do prazo.
export function classificar(dose: DoseApi, agoraMin: number): StatusTela {
  if (dose.status === 'tomada') return 'tomada';
  if (dose.status === 'pendente') return 'futura';
  return agoraMin - minutosDoDia(dose.horario) >= PRAZO_ATRASO_MIN ? 'atrasada' : 'pendente';
}

// "2026-11-14T19:13:38Z" -> "16:13" (no fuso informado)
export function horaLocal(iso: string, fuso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(iso));
  } catch {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
