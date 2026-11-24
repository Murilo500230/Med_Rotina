const mysql = require("mysql2/promise");
require("dotenv").config();

// Bancos hospedados (nuvem) normalmente exigem conexão segura: DB_SSL=true
const usarSsl = process.env.DB_SSL === "true";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ...(usarSsl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
});

module.exports = pool;
