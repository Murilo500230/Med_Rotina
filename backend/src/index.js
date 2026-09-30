const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Rota de teste - confirma que a API está no ar
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API do MedRotina rodando" });
});

// Rota de teste - confirma a conexão com o banco
app.get("/health/db", async (req, res) => {
  const pool = require("./config/db");
  try {
    await pool.query("SELECT 1");
    res.json({ database: "conectado" });
  } catch (err) {
    res.status(500).json({ database: "erro", details: err.message });
  }
});

// TODO (T3): registrar rotas de autenticação -> require("./routes/auth")
// TODO (T4): registrar rotas de medicamentos -> require("./routes/medicamentos")

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
