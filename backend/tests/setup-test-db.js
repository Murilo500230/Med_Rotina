const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
  const rootConn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "medrotina_pass",
    multipleStatements: true,
  });

  console.log("Conectado ao MariaDB (3307) como root.");

  await rootConn.query(
    "CREATE USER IF NOT EXISTS 'medrotina_user'@'%' IDENTIFIED BY 'medrotina_pass';"
  );
  await rootConn.query(
    "GRANT ALL PRIVILEGES ON *.* TO 'medrotina_user'@'%' WITH GRANT OPTION;"
  );
  await rootConn.query("FLUSH PRIVILEGES;");
  console.log("Usuário medrotina_user configurado.");

  const schemaPath = path.join(__dirname, "../src/config/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  await rootConn.query(schemaSql);
  console.log("Schema aplicado com sucesso no banco medrotina!");

  const [tabelas] = await rootConn.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'medrotina';"
  );
  console.log("Tabelas existentes:", tabelas.map((t) => t.table_name || t.TABLE_NAME));

  await rootConn.end();
}

main().catch((err) => {
  console.error("Erro na inicialização do banco de teste:", err);
  process.exit(1);
});
