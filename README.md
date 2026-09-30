# MedRotina

App mobile de adesão a tratamento médico contínuo — lembretes de medicação, histórico de adesão e alerta automático ao cuidador.

**Disciplina:** SIS927 — Projeto de Desenvolvimento Mobile — UNEX

## Equipe
- Cahuan Gomes Gonçalves — Front-end (telas e navegação)
- Darlan de Jesus Malta — Back-end (autenticação e medicamentos)
- Jailton dos Santos Silva Junior — Banco de dados e notificações
- Luiz Alberto Sousa da Silva — Back-end (medicamentos e documentação)
- Murilo Bastos Ferreira — Ambiente e front-end (tela inicial)

## Stack
- **Front-end:** React Native + Expo (JavaScript/TypeScript)
- **Back-end:** Node.js + Express (JavaScript/TypeScript)
- **Banco de dados:** MySQL

## Como rodar (via GitHub Codespaces)

1. No repositório do GitHub, clique em **Code → Codespaces → Create codespace on main**
2. Aguarde o ambiente subir (Node.js e MySQL já vêm configurados automaticamente)
3. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Instale as dependências do back-end:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. A API sobe em `http://localhost:3000`. Teste em `/` e `/health/db`.

### Front-end (Expo)

Ainda não gerado neste repositório. Dentro do Codespace, rode:
```bash
npx create-expo-app frontend
cd frontend
npx expo start
```
Isso cria a pasta `frontend/` com o projeto Expo já pronto para começar as telas.

## Estrutura do projeto

```
medrotina/
├── .devcontainer/       # Configuração do Codespaces (Node + MySQL)
├── backend/             # API Node.js + Express
│   └── src/
│       ├── config/      # Conexão com banco (db.js) e schema.sql
│       ├── controllers/ # Lógica de negócio (a implementar)
│       ├── routes/      # Endpoints da API (a implementar)
│       └── index.js     # Ponto de entrada do servidor
└── frontend/             # App React Native + Expo (gerar localmente)
```

## Sprint 1 — Tarefas (14/09 a 05/10)

Ver `1º Relatório de Sprint` para a lista completa de tarefas, responsáveis e prioridades.
