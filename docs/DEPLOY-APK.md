# Gerar o APK do MedRotina (Android)

O APK não usa o proxy do Metro: ele precisa de uma **URL pública (https) da API**.

## 1. Publicar o back-end
Precisa de dois serviços: um para a API Node e um MySQL na nuvem (com SSL).

**API (ex.: Render, "Web Service")**
- Root Directory: `backend` | Build: `npm install` | Start: `npm start`
- Variáveis de ambiente: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `DB_SSL=true`, `JWT_SECRET` (um segredo forte), `JWT_EXPIRES_IN=1d`
- Teste: abrir `https://SUA-API/` deve mostrar `{"status":"ok",...}` e `/health/db` deve mostrar `conectado`.
- Planos grátis costumam "dormir" após alguns minutos parado: abra a URL antes de apresentar.

**Banco**: crie um MySQL (ou compatível) e rode uma vez, no Codespace, com as variáveis do banco no `backend/.env`:
```bash
cd backend && npm run setup-db
```
(cria as 6 tabelas; pode rodar mais de uma vez sem problema)

## 2. Build do APK (no Codespace)
```bash
cd frontend
# edite eas.json: troque COLOQUE_AQUI_A_URL_PUBLICA_DA_API pela URL da API (sem barra no final)
npx eas-cli login
npx eas-cli init          # cria o projeto na sua conta Expo
npx eas-cli build -p android --profile preview
```
Ao final o terminal mostra um link/QR para baixar o `.apk`.

## 3. Instalar
Abra o link no Android, baixe o `.apk` e permita "instalar de fontes desconhecidas".
Na primeira abertura, aceite a permissão de notificações (necessária para os lembretes).
