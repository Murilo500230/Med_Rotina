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
