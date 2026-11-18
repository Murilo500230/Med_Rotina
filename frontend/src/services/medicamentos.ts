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

// T16: edita um medicamento (PUT /medicamentos/:id)
export async function atualizarMedicamento(id: number, dados: NovoMedicamento, token: string) {
  const resposta = await fetch(`${API_URL}/medicamentos/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  const conteudo = await lerResposta(resposta);
  if (!resposta.ok) {
    const erro = conteudo as RespostaErro;
    throw new Error(erro.erro || erro.mensagem || 'Não foi possível atualizar o medicamento');
  }

  return conteudo as Medicamento;
}

// T16: exclui um medicamento (DELETE /medicamentos/:id, resposta 204 sem corpo)
export async function excluirMedicamento(id: number, token: string): Promise<void> {
  const resposta = await fetch(`${API_URL}/medicamentos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resposta.ok) {
    const erro = (await lerResposta(resposta)) as RespostaErro;
    throw new Error(erro.erro || erro.mensagem || 'Não foi possível excluir o medicamento');
  }
}
