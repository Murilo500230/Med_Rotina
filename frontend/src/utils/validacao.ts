// Validações dos formulários de login e cadastro (T5)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SENHA_MIN = 6;

export function validarNome(nome: string): string | undefined {
  if (!nome.trim()) return 'Informe seu nome.';
  if (nome.trim().length < 3) return 'O nome deve ter ao menos 3 caracteres.';
}

export function validarEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe seu e-mail.';
  if (!EMAIL_REGEX.test(email.trim())) return 'E-mail inválido.';
}

export function validarSenha(senha: string): string | undefined {
  if (!senha) return 'Informe sua senha.';
  if (senha.length < SENHA_MIN) return `A senha deve ter ao menos ${SENHA_MIN} caracteres.`;
}

export function validarConfirmacao(senha: string, confirmacao: string): string | undefined {
  if (!confirmacao) return 'Confirme sua senha.';
  if (senha !== confirmacao) return 'As senhas não coincidem.';
}

// Cuidadores (T15) — mesmas regras da API (T13) para evitar ida ao servidor com dados inválidos
const TELEFONE_REGEX = /^\+?[0-9\s().-]{8,20}$/;

export function validarNomeCuidador(nome: string): string | undefined {
  const texto = nome.trim();
  if (!texto) return 'Informe o nome do cuidador.';
  if (texto.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
}

export function validarContatoCuidador(contato: string): string | undefined {
  const texto = contato.trim();
  if (!texto) return 'Informe um e-mail ou telefone.';
  if (texto.length > 150) return 'O contato deve ter no máximo 150 caracteres.';
  if (!EMAIL_REGEX.test(texto) && !TELEFONE_REGEX.test(texto)) {
    return 'Informe um e-mail válido ou um telefone com DDD.';
  }
}
