# T18 — API de histórico de adesão

Rota usada pela tela de histórico do app. Exige `Authorization: Bearer <token>`.

## GET /historico?dias=7

Lista, por dia, as doses do usuário autenticado em `doses_diarias`, do dia mais recente para o mais antigo.

- `dias`: inteiro de 1 a 60 (padrão 7). Valor inválido retorna 400.
- Só aparecem dias em que as doses foram geradas (`POST /doses/gerar`). O app chama `gerar` sempre que a Home é aberta.
- Status de cada dose (mesma regra da T11): `tomada`; `atrasada` (não tomada e o horário já passou, inclusive em dias anteriores); `pendente` (o horário ainda não chegou).
- `adesao` = tomadas ÷ (tomadas + atrasadas), em %, arredondado. É `null` quando ainda não há dose vencida.

Resposta 200, exemplo:

```json
{
  "dias": 7,
  "fuso": "America/Sao_Paulo",
  "resumo": { "tomadas": 3, "vencidas": 5, "adesao": 60 },
  "historico": [
    {
      "data": "2026-11-14",
      "total": 3,
      "tomadas": 1,
      "atrasadas": 1,
      "pendentes": 1,
      "adesao": 50,
      "doses": [
        {
          "id": 1,
          "medicamento_id": 1,
          "nome_medicamento": "Losartana",
          "dosagem": "50 mg",
          "data": "2026-11-14",
          "horario": "00:05:00",
          "status": "tomada",
          "tomada_em": "2026-11-14T19:13:38Z"
        }
      ]
    }
  ]
}
```
