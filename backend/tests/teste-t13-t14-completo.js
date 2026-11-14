const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Importa app express sem dar listen na porta fixa (usaremos porta efêmera para teste)
const express = require("express");
const cors = require("cors");
const authRoutes = require("../src/routes/auth");
const db = require("../src/config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use("/medicamentos", require("../src/routes/medicamentos.routes"));
app.use("/doses", require("../src/routes/doses.routes"));
app.use("/cuidadores", require("../src/routes/cuidadores.routes"));
app.use("/alertas", require("../src/routes/alertas.routes"));

app.get("/", (req, res) => res.json({ status: "ok" }));
app.get("/health/db", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ database: "conectado" });
  } catch (err) {
    res.status(500).json({ database: "erro" });
  }
});

let server;
let baseUrl;

function requisicao(metodo, caminho, { token, corpo } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(caminho, baseUrl);
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const payload = corpo ? JSON.stringify(corpo) : null;
    if (payload) {
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method: metodo,
        headers,
      },
      (res) => {
        let dados = "";
        res.on("data", (chunk) => (dados += chunk));
        res.on("end", () => {
          let json = null;
          try {
            if (dados) json = JSON.parse(dados);
          } catch (e) {
            json = dados;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function asserir(condicao, mensagem) {
  if (!condicao) {
    console.error(`❌ FALHA: ${mensagem}`);
    throw new Error(mensagem);
  }
  console.log(`  ✅ ${mensagem}`);
}

async function rodarTestes() {
  console.log("\n=======================================================");
  console.log("  INICIANDO SUÍTE DE TESTES T13 E T14 (MedRotina)");
  console.log("=======================================================\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const porta = server.address().port;
  baseUrl = `http://127.0.0.1:${porta}`;
  console.log(`Servidor de teste rodando em: ${baseUrl}\n`);

  // 1. Verificação de Saúde
  console.log("[1] Checando saúde da API e Banco...");
  const resRaiz = await requisicao("GET", "/");
  asserir(resRaiz.status === 200 && resRaiz.body.status === "ok", "Rota raiz responde 200 OK");

  const resDb = await requisicao("GET", "/health/db");
  asserir(resDb.status === 200 && resDb.body.database === "conectado", "Conexão com MariaDB estabelecida com sucesso");

  // 2. Criação de usuários de teste
  console.log("\n[2] Cadastrando e autenticando usuários de teste...");
  const timestamp = Date.now();
  const emailA = `darlan.teste.${timestamp}@medrotina.com`;
  const emailB = `outro.paciente.${timestamp}@medrotina.com`;

  await requisicao("POST", "/register", {
    corpo: { nome: "Darlan Malta", email: emailA, senha: "SenhaForte123@" },
  });
  const resLoginA = await requisicao("POST", "/login", {
    corpo: { email: emailA, senha: "SenhaForte123@" },
  });
  asserir(resLoginA.status === 200 && resLoginA.body.token, "Usuário A cadastrado e autenticado via JWT");
  const tokenA = resLoginA.body.token;

  await requisicao("POST", "/register", {
    corpo: { nome: "Outro Paciente", email: emailB, senha: "SenhaForte123@" },
  });
  const resLoginB = await requisicao("POST", "/login", {
    corpo: { email: emailB, senha: "SenhaForte123@" },
  });
  asserir(resLoginB.status === 200 && resLoginB.body.token, "Usuário B cadastrado e autenticado via JWT");
  const tokenB = resLoginB.body.token;

  // 3. Testes T13 - CRUD de Cuidadores
  console.log("\n[3] Testando T13: CRUD de Cuidadores...");

  // 3.1 Segurança e validação de autenticação
  const resSemAuth = await requisicao("GET", "/cuidadores");
  asserir(resSemAuth.status === 401, "Acesso a /cuidadores sem token retorna 401");

  // 3.2 Validação de payload
  const resCorpoInvalido = await requisicao("POST", "/cuidadores", {
    token: tokenA,
    corpo: { nome: "", contato: "" },
  });
  asserir(resCorpoInvalido.status === 400, "Criação de cuidador com campos vazios retorna 400");

  const resContatoInvalido = await requisicao("POST", "/cuidadores", {
    token: tokenA,
    corpo: { nome: "Cuidador Teste", contato: "invalido@@nao-e-telefone" },
  });
  asserir(resContatoInvalido.status === 400, "Contato inválido (nem email nem telefone) retorna 400");

  // 3.3 Cadastro válido com e-mail
  const resCriar1 = await requisicao("POST", "/cuidadores", {
    token: tokenA,
    corpo: { nome: "Maria de Lourdes", contato: "maria.cuidadora@email.com" },
  });
  asserir(resCriar1.status === 201 && resCriar1.body.id, "POST /cuidadores com e-mail retorna 201 Created");
  const cuidadorId1 = resCriar1.body.id;

  // 3.4 Cadastro válido com telefone
  const resCriar2 = await requisicao("POST", "/cuidadores", {
    token: tokenA,
    corpo: { nome: "Carlos Eduardo", contato: "(77) 98888-4444" },
  });
  asserir(resCriar2.status === 201 && resCriar2.body.id, "POST /cuidadores com telefone retorna 201 Created");
  const cuidadorId2 = resCriar2.body.id;

  // 3.5 Listagem de cuidadores do Usuário A
  const resListarA = await requisicao("GET", "/cuidadores", { token: tokenA });
  asserir(
    resListarA.status === 200 &&
    Array.isArray(resListarA.body) &&
    resListarA.body.length === 2 &&
    resListarA.body[0].nome === "Carlos Eduardo", // Ordem alfabética
    "GET /cuidadores lista cuidadores ordenados alfabeticamente"
  );

  // 3.6 Isolamento de cuidadores (Usuário B não vê cuidadores do Usuário A)
  const resListarB = await requisicao("GET", "/cuidadores", { token: tokenB });
  asserir(
    resListarB.status === 200 && resListarB.body.length === 0,
    "GET /cuidadores para Usuário B retorna lista vazia (isolamento garantido)"
  );

  // 3.7 Busca por ID
  const resBuscar = await requisicao("GET", `/cuidadores/${cuidadorId1}`, { token: tokenA });
  asserir(resBuscar.status === 200 && resBuscar.body.nome === "Maria de Lourdes", "GET /cuidadores/:id retorna cuidador correto");

  const resBuscarAlheio = await requisicao("GET", `/cuidadores/${cuidadorId1}`, { token: tokenB });
  asserir(resBuscarAlheio.status === 404, "Acesso a cuidador de outro usuário retorna 404 Not Found");

  const resIdInvalido = await requisicao("GET", "/cuidadores/invalido", { token: tokenA });
  asserir(resIdInvalido.status === 400, "ID não numérico retorna 400 Bad Request");

  // 3.8 Atualização (PUT)
  const resPut = await requisicao("PUT", `/cuidadores/${cuidadorId1}`, {
    token: tokenA,
    corpo: { nome: "Maria de Lourdes Silva", contato: "maria.silva@email.com" },
  });
  asserir(
    resPut.status === 200 && resPut.body.nome === "Maria de Lourdes Silva",
    "PUT /cuidadores/:id atualiza dados do cuidador"
  );

  const resPutAlheio = await requisicao("PUT", `/cuidadores/${cuidadorId1}`, {
    token: tokenB,
    corpo: { nome: "Hacker", contato: "hack@email.com" },
  });
  asserir(resPutAlheio.status === 404, "Tentativa de atualizar cuidador alheio retorna 404");

  // 3.9 Exclusão (DELETE)
  const resDelAlheio = await requisicao("DELETE", `/cuidadores/${cuidadorId2}`, { token: tokenB });
  asserir(resDelAlheio.status === 404, "Tentativa de excluir cuidador alheio retorna 404");

  const resDel = await requisicao("DELETE", `/cuidadores/${cuidadorId2}`, { token: tokenA });
  asserir(resDel.status === 204, "DELETE /cuidadores/:id retorna 204 No Content");

  const resConfirmaDel = await requisicao("GET", `/cuidadores/${cuidadorId2}`, { token: tokenA });
  asserir(resConfirmaDel.status === 404, "Cuidador excluído não é mais encontrado (404)");

  // 4. Testes T14 - Alertas ao Cuidador
  console.log("\n[4] Testando T14: Rotina de Alerta ao Cuidador...");

  // 4.1 Cadastro de medicamento com horário passado para gerar dose atrasada
  const resMed = await requisicao("POST", "/medicamentos", {
    token: tokenA,
    corpo: {
      nome: "Losartana Potássica",
      dosagem: "50 mg",
      horarios: ["06:00"], // Horário da manhã, já ultrapassou o horário atual com folga
    },
  });
  asserir(resMed.status === 201, "Medicamento de teste criado com sucesso");

  // 4.2 Geração das doses do dia (T11 do Luiz)
  const resGerarDoses = await requisicao("POST", "/doses/gerar", { token: tokenA });
  asserir(resGerarDoses.status === 200 && resGerarDoses.body.total >= 1, "Doses do dia geradas via T11");

  // 4.3 Verificação de alertas pendentes (T14)
  const resAlerta = await requisicao("POST", "/alertas/verificar", {
    token: tokenA,
    corpo: { tolerancia_minutos: 10 },
  });
  asserir(
    resAlerta.status === 200 &&
    resAlerta.body.total_doses_atrasadas >= 1 &&
    resAlerta.body.total_alertas_gerados === 1,
    "Rotina T14 identificou dose não confirmada e gerou alerta ao cuidador"
  );
  asserir(
    resAlerta.body.alertas[0].nome_cuidador === "Maria de Lourdes Silva",
    "Alerta foi direcionado ao cuidador cadastrado do paciente"
  );

  // 4.4 Histórico de alertas
  const resHistorico = await requisicao("GET", "/alertas", { token: tokenA });
  asserir(
    resHistorico.status === 200 &&
    Array.isArray(resHistorico.body) &&
    resHistorico.body.length >= 1 &&
    resHistorico.body[0].nome_medicamento === "Losartana Potássica",
    "GET /alertas lista histórico de alertas gerados com detalhes da dose"
  );

  // 4.5 Prevenção de Spam / Duplicidade (Reexecutar a verificação não pode gerar novo alerta)
  const resAlertaReexecutado = await requisicao("POST", "/alertas/verificar", {
    token: tokenA,
    corpo: { tolerancia_minutos: 10 },
  });
  asserir(
    resAlertaReexecutado.status === 200 &&
    resAlertaReexecutado.body.total_alertas_gerados === 0,
    "Rotina T14 previne duplicidade: não reenvia alerta para dose já alertada"
  );

  // 4.6 Isolamento de alertas do Usuário B
  const resHistoricoB = await requisicao("GET", "/alertas", { token: tokenB });
  asserir(
    resHistoricoB.status === 200 && resHistoricoB.body.length === 0,
    "Usuário B não tem acesso aos alertas do Usuário A"
  );

  console.log("\n=======================================================");
  console.log("  TODOS OS TESTES DE T13 E T14 FORAM APROVADOS! (100%)");
  console.log("=======================================================\n");

  server.close();
  await db.end();
  process.exit(0);
}

rodarTestes().catch((err) => {
  console.error("Falha na execução dos testes:", err);
  if (server) server.close();
  process.exit(1);
});
