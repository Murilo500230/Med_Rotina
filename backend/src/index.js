const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use("/medicamentos", require("./routes/medicamentos.routes"));

// Rota de teste - confirma que a API está no ar
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API do MedRotina rodando"
  });
});

// Rota de teste - confirma a conexão com o banco
app.get("/health/db", async (req, res) => {
  try {
    const pool = require("./config/db");

    await pool.query("SELECT 1");

    res.json({ database: "conectado" });
  } catch (err) {
    console.error("Erro na conexão com o banco:", err);

    res.status(500).json({
      database: "erro"
    });
  }
});

// Tratamento de erros - depois das rotas
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      erro: "JSON inválido."
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      erro: "Corpo da requisição muito grande."
    });
  }

  console.error(err);

  return res.status(500).json({
    erro: "Erro interno do servidor."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
