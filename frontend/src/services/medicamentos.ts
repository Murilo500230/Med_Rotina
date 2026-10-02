export type NovoMedicamento = {
  nome: string;
  dosagem: string;
  horarios: string[];
};

type RespostaErro = {
  erro?: string;
  mensagem?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function cadastrarMedicamento(dados: NovoMedicamento, token: string) {
  const resposta = await fetch(`${API_URL}/medicamentos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  const conteudo = (await resposta.json().catch(() => ({}))) as RespostaErro;

  if (!resposta.ok) {
    throw new Error(conteudo.erro || conteudo.mensagem || 'Não foi possível cadastrar o medicamento');
  }

  return conteudo;
}
