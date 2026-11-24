// Cria as tabelas no banco indicado pelo .env (útil em banco hospedado,
// onde o nome do banco já existe e não se pode usar CREATE DATABASE / USE).
// Uso: node scripts/setup-db.js
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pool = require("../src/config/db");

function comandos(sql) {
  return sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c && !/^(CREATE DATABASE|USE)\b/i.test(c));
}

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "src", "config", "schema.sql"), "utf8");
  const lista = comandos(sql);
  for (const c of lista) await pool.query(c);
  console.log(`Schema aplicado (${lista.length} comandos).`);
  await pool.end();
})().catch((e) => {
  console.error("Falha ao aplicar o schema:", e.message);
  process.exit(1);
});
