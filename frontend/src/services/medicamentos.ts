export type NovoMedicamento = {
  nome: string;
  dosagem: string;
  horarios: string[];
};

export type Medicamento = NovoMedicamento & {
  id: number;
  frequencia: string;
};

type RespostaErro = {
  erro?: string;
  mensagem?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function lerResposta(resposta: Response): Promise<unknown> {
  return resposta.json().catch(() => ({}));
}

export async function cadastrarMedicamento(dados: NovoMedicamento, token: string) {
  const resposta = await fetch(`${API_URL}/medicamentos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) {
    const erro = conteudo as RespostaErro;
    throw new Error(erro.erro || erro.mensagem || 'Não foi possível cadastrar o medicamento');
  }

  return conteudo as Medicamento;
}

export async function listarMedicamentos(token: string) {
  const resposta = await fetch(`${API_URL}/medicamentos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) {
    const erro = conteudo as RespostaErro;
    throw new Error(erro.erro || erro.mensagem || 'Não foi possível carregar os medicamentos');
  }

  return conteudo as Medicamento[];
}
