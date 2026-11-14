// Textos de apoio para as telas
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function primeiraMaiuscula(texto: string) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

// 45 -> "45 min"; 130 -> "2 h 10 min"
export function duracaoCurta(minutos: number) {
  const m = Math.max(0, Math.round(minutos));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

function partes(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return { ano, mes, dia, semana: new Date(ano, mes - 1, dia).getDay() };
}

// "2026-11-14" -> "14/11"
export function dataCurta(iso: string) {
  const { mes, dia } = partes(iso);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

// "2026-11-14" -> "Sábado"
export function diaDaSemana(iso: string) {
  return primeiraMaiuscula(DIAS[partes(iso).semana]);
}

// "2026-11-14" -> "Sábado, 14 de novembro"
export function dataLonga(iso: string) {
  const { dia, mes } = partes(iso);
  return `${diaDaSemana(iso)}, ${dia} de ${MESES[mes - 1]}`;
}
