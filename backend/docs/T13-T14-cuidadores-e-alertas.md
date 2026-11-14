# T13 e T14 — API de Cuidadores e Rotina de Alerta ao Cuidador

**Responsável:** Darlan de Jesus Malta  
**Frente:** Back-end  
**Sprint:** 2  

---

## 1. Visão Geral

Este documento detalha as implementações das tarefas **T13** (API CRUD de Cuidadores) e **T14** (Rotina de Alerta ao Cuidador por atraso de medicação), que compõem o fluxo de adesão e segurança do paciente no **MedRotina**.

---

## 2. Autenticação

Todas as rotas de cuidadores e alertas exigem o cabeçalho:

```http
Authorization: Bearer <token_jwt>
```

- O token JWT é obtido no login (`POST /login`) ou cadastro (`POST /register`).
- O usuário autenticado é extraído do campo `sub` do payload do token (`req.usuario = { id }`).
- Todas as operações são estritamente isoladas por usuário: nenhum usuário pode visualizar, alterar, excluir ou receber dados de cuidadores de outro usuário.

---

## 3. Banco de Dados

### Tabelas utilizadas

1. **`cuidadores`**: armazena os cuidadores associados ao usuário.
2. **`doses_diarias`**: ocorrências diárias de medicação (implementada em T11).
3. **`alertas_cuidadores`**: histórico e rastreabilidade de alertas disparados aos cuidadores para evitar duplicidades de envio.

### Migrações

- `backend/src/config/migrations/001_doses_diarias.sql`: tabela de doses diárias (T11).
- `backend/src/config/migrations/002_alertas_cuidadores.sql`: ajuste de tamanho do campo contato e criação da tabela `alertas_cuidadores`.

O arquivo consolidado `backend/src/config/schema.sql` já contém todas as definições completas para novas instalações.

---

## 4. Endpoints — T13: CRUD de Cuidadores

### `POST /cuidadores`
Cadastra um novo cuidador para o usuário logado.

- **Corpo da requisição (JSON):**
  ```json
  {
    "nome": "Maria de Lourdes",
    "contato": "maria.cuidadora@email.com"
  }
  ```
  *(O campo `contato` aceita tanto e-mails válidos quanto números de telefone com DDD).*

- **Resposta de sucesso (`201 Created`):**
  ```json
  {
    "id": 1,
    "usuario_id": 2,
    "nome": "Maria de Lourdes",
    "contato": "maria.cuidadora@email.com"
  }
  ```

---

### `GET /cuidadores`
Lista todos os cuidadores cadastrados pelo usuário autenticado, ordenados alfabeticamente por nome.

- **Resposta de sucesso (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "nome": "Maria de Lourdes",
      "contato": "maria.cuidadora@email.com"
    }
  ]
  ```

---

### `GET /cuidadores/:id`
Busca os detalhes de um cuidador específico pertencente ao usuário.

- **Resposta de sucesso (`200 OK`):**
  ```json
  {
    "id": 1,
    "nome": "Maria de Lourdes",
    "contato": "maria.cuidadora@email.com"
  }
  ```
- **Respostas de erro:**
  - `400 Bad Request`: ID inválido (não inteiro positivo ou overflow).
  - `404 Not Found`: Cuidador não encontrado ou pertencente a outro usuário.

---

### `PUT /cuidadores/:id`
Atualiza o nome ou o contato de um cuidador existente.

- **Corpo da requisição (JSON):**
  ```json
  {
    "nome": "Maria de Lourdes Silva",
    "contato": "(77) 98888-7777"
  }
  ```
- **Resposta de sucesso (`200 OK`):**
  ```json
  {
    "id": 1,
    "nome": "Maria de Lourdes Silva",
    "contato": "(77) 98888-7777"
  }
  ```

---

### `DELETE /cuidadores/:id`
Exclui um cuidador do usuário.

- **Resposta de sucesso (`204 No Content`)** (sem corpo).
- **Respostas de erro:**
  - `404 Not Found`: Cuidador não pertence ao usuário ou não existe.

---

## 5. Endpoints e Rotina — T14: Alertas ao Cuidador

### Regra de Negócio de Atraso
Uma dose é considerada em atraso quando:
1. `status != 'tomada'` e `tomada_em IS NULL` na tabela `doses_diarias`.
2. O horário previsto acrescido da tolerância (`horario + tolerancia`) for menor ou igual ao horário atual (no fuso `America/Sao_Paulo`), ou for referente a um dia anterior não concluído.
3. Tolerância padrão: **30 minutos** (configurável via `ALERTA_TOLERANCIA_MINUTOS`).

### Prevenção de Spam / Duplicidade
A rotina consulta a restrição única `UNIQUE (dose_diaria_id, cuidador_id)` na tabela `alertas_cuidadores`. Cada cuidador recebe no máximo **1 alerta** por ocorrência de dose não confirmada.

### Disparo e Notificação
- Se o servidor estiver configurado com credenciais SMTP (`SMTP_HOST`, `SMTP_USER`, etc.), um e-mail formatado é enviado diretamente ao cuidador via `nodemailer`.
- Se as credenciais SMTP não estiverem preenchidas (ambiente de desenvolvimento/testes locais), o alerta é registrado em modo `simulado`, emitindo log estruturado no console e registrando a persistência no banco.

---

### `POST /alertas/verificar`
Dispara manualmente a rotina de verificação e envio de alertas para as doses pendentes do usuário logado.

- **Corpo opcional (JSON):**
  ```json
  {
    "tolerancia_minutos": 15
  }
  ```
- **Resposta de sucesso (`200 OK`):**
  ```json
  {
    "mensagem": "Verificação de alertas executada com sucesso.",
    "executado_em": "2026-11-14 13:45:00",
    "fuso": "America/Sao_Paulo",
    "tolerancia_minutos": 30,
    "total_doses_atrasadas": 1,
    "total_alertas_gerados": 1,
    "alertas": [
      {
        "id": 1,
        "dose_diaria_id": 12,
        "cuidador_id": 3,
        "nome_cuidador": "Maria de Lourdes",
        "contato_cuidador": "maria.cuidadora@email.com",
        "nome_medicamento": "Losartana",
        "data_dose": "2026-11-14",
        "horario_dose": "08:00:00",
        "minutos_atraso": 345,
        "canal": "email",
        "status": "simulado"
      }
    ]
  }
  ```

---

### `GET /alertas`
Lista o histórico de todos os alertas disparados para os cuidadores do usuário logado, ordenados do mais recente para o mais antigo.

- **Resposta de sucesso (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "cuidador_id": 3,
      "dose_diaria_id": 12,
      "nome_cuidador": "Maria de Lourdes",
      "contato_cuidador": "maria.cuidadora@email.com",
      "nome_medicamento": "Losartana",
      "dosagem": "50 mg",
      "data_dose": "2026-11-14",
      "horario_dose": "08:00:00",
      "minutos_atraso": 345,
      "mensagem": "Olá, Maria de Lourdes! Atenção: o paciente João da Silva possui a dose do medicamento \"Losartana\" (50 mg) prevista para 08:00:00 em 2026-11-14 que ainda não foi confirmada...",
      "canal": "email",
      "status": "simulado",
      "enviado_em": "2026-11-14 13:45:00"
    }
  ]
  ```

---

### Rotina Automática no Servidor
Ao iniciar a aplicação (`npm start`), o servidor ativa uma rotina em segundo plano (`iniciarRotinaAlertas`) que executa a cada 5 minutos (configurável via `ALERTAS_INTERVALO_MINUTOS`). Pode ser desativada com `ALERTAS_AUTOMATICOS=false` em cenários de testes unitários controlados.
