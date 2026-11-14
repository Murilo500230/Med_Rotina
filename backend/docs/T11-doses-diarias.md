# T11 — API de doses diárias

## Autenticação

Todas as rotas exigem:

Authorization: Bearer <token>

O token é obtido no cadastro ou login. O usuário é identificado pelo
campo sub do JWT. Não é necessário enviar usuario_id no corpo.

## Banco de dados

- doses: agenda de horários usada pelo cadastro atual de medicamentos.
- doses_diarias: ocorrências diárias e suas confirmações.

Para bancos existentes, executar com uma ferramenta SQL, no banco
medrotina, o arquivo:

src/config/migrations/001_doses_diarias.sql

Para bancos novos, a tabela também está incluída em src/config/schema.sql.

A migração deve ser aplicada antes de usar as rotas de doses.
CREATE TABLE IF NOT EXISTS não atualiza uma tabela já existente.

## POST /doses/gerar

Gera as doses de hoje para o usuário autenticado, a partir dos horários
armazenados em doses e dos medicamentos pertencentes ao usuário.

Corpo: nenhum obrigatório.

Resposta 200, exemplo:

{
  "mensagem": "Doses do dia geradas. Registros existentes foram preservados.",
  "data": "2026-11-13",
  "fuso": "America/Sao_Paulo",
  "total": 1
}

total representa todas as doses do usuário naquele dia, não apenas
a quantidade criada pela chamada.

Chamadas repetidas preservam registros existentes e suas confirmações.
A combinação medicamento_id, data e horario é única.

Medicamentos sem horários cadastrados não geram doses.
O texto livre do campo frequencia não é interpretado.

## GET /doses/hoje

Lista as doses de hoje do usuário autenticado, ordenadas por horário e ID.

Corpo: nenhum.

Resposta 200, exemplo:

{
  "data": "2026-11-13",
  "fuso": "America/Sao_Paulo",
  "doses": [
    {
      "id": 1,
      "medicamento_id": 2,
      "nome_medicamento": "Medicamento fictício T11",
      "dosagem": "Somente teste",
      "data": "2026-11-13",
      "horario": "00:00:00",
      "status": "tomada",
      "tomada_em": "2026-11-13T23:33:07Z"
    }
  ]
}

Se não houver registros, doses será uma lista vazia.

A listagem não gera doses automaticamente. O app deve chamar
POST /doses/gerar antes de consultar as doses do dia.

## PATCH /doses/:id/tomar

Confirma uma dose pertencente ao usuário autenticado.

Corpo: nenhum obrigatório.

Resposta 200, exemplo:

{
  "id": 1,
  "status": "tomada",
  "tomada_em": "2026-11-13T23:33:07Z"
}

Repetir a confirmação mantém o primeiro tomada_em.
Doses atrasadas podem ser confirmadas.
Doses anteriores a hoje também podem ser confirmadas pelo ID.
Doses futuras não podem ser confirmadas.

## Códigos de resposta

- 200: operação concluída.
- 400: ID de dose inválido.
- 401: token ausente, inválido ou expirado.
- 404: dose inexistente ou pertencente a outro usuário.
- 409: tentativa de confirmar antes do horário previsto.
- 500: falha interna ou configuração de autenticação ausente.

## Datas e status

O dia e o horário previsto são interpretados em America/Sao_Paulo.
tomada_em é armazenado em UTC e retornado com sufixo Z.

Na listagem:
- tomada: dose confirmada.
- atrasada: dose não confirmada cujo horário já passou.
- pendente: dose não confirmada cujo horário ainda não passou ou é igual
  ao horário atual.

A listagem calcula atrasada, mas não grava essa alteração no banco.
Doses futuras são retornadas como pendente, sem status futura separado.

## Preservação do histórico

Os registros diários armazenam cópias do nome e da dosagem.
Alterar o medicamento não altera essas cópias em registros existentes.
Excluir o medicamento mantém os registros diários, com medicamento_id nulo.
Excluir o usuário remove seus registros diários.

## Limitações e integração com outras tarefas

- Não existe agendador automático de geração diária nesta implementação.
- A geração ocorre quando POST /doses/gerar é chamado.
- Não são reconstruídas doses de dias anteriores que não foram geradas.
- Não há endpoint de consulta por período para a tela de histórico.
- Alterar ou remover horários não cancela doses diárias já geradas.
- Excluir um medicamento não cancela seus registros diários pendentes.
- Repetir a geração pode acrescentar horários novos, mas não remove antigos.
- A sincronização das ocorrências após edição/exclusão precisa ser
  alinhada com a equipe antes de considerar esse fluxo integrado completo.
- A rotina T14 não deve depender apenas de status = 'atrasada':
  deve considerar data, horário e ausência de confirmação.
- Para alertas automáticos sem o app aberto, a equipe precisa definir
  como gerar as ocorrências no servidor.
- Nenhuma rotina de alerta ou envio ao cuidador foi implementada na T11.

## Testes executados em 13/11/2026

- [x] API responde em /.
- [x] /health/db confirma conexão.
- [x] Listagem sem token retorna 401.
- [x] Geração cria a dose esperada.
- [x] Repetir geração mantém uma única dose.
- [x] Listagem retorna a dose do usuário.
- [x] Confirmação retorna tomada e tomada_em.
- [x] Repetir confirmação preserva tomada_em.
- [x] Listagem final mostra dose tomada.
- [x] Outro usuário não visualiza doses alheias.
- [x] Usuário sem medicamentos gera zero doses.
- [x] Confirmar dose de outro usuário retorna 404.
- [x] IDs abc, 0, -1 e 2147483648 retornam 400.
- [x] Geração sem token retorna 401.
- [x] Listagem com token inválido retorna 401.
- [x] Dose futura aparece pendente, sem confirmação.
- [x] Confirmação antecipada retorna 409.
- [x] Tentativa antecipada não altera a dose.

Não foram executados testes de concorrência, virada do dia,
edição/exclusão integrada ou fluxo completo com cuidador.
Os usuários e medicamentos fictícios dos testes foram mantidos no banco.
