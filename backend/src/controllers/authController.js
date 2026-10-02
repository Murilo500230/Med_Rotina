const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign(
    {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
}

function validarCadastro({ nome, email, senha }) {
  if (!nome || !email || !senha) {
    return "Nome, e-mail e senha são obrigatórios";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Informe um e-mail válido";
  }

  if (senha.length < 6) {
    return "A senha deve ter pelo menos 6 caracteres";
  }

  return null;
}

async function register(req, res) {
  const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const senha = typeof req.body.senha === "string" ? req.body.senha : "";

  const erroValidacao = validarCadastro({ nome, email, senha });
  if (erroValidacao) {
    return res.status(400).json({ erro: erroValidacao });
  }

  try {
    const [usuariosExistentes] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [resultado] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome, email, senhaHash],
    );

    const usuario = { id: resultado.insertId, nome, email };
    const token = gerarToken(usuario);

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso",
      usuario,
      token,
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    }

    console.error("Erro ao cadastrar usuário:", erro);
    return res.status(500).json({ erro: "Não foi possível cadastrar o usuário" });
  }
}

async function login(req, res) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const senha = typeof req.body.senha === "string" ? req.body.senha : "";

  if (!email || !senha) {
    return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
  }

  try {
    const [usuarios] = await pool.query(
      "SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const usuarioEncontrado = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuarioEncontrado.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const usuario = {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      email: usuarioEncontrado.email,
    };
    const token = gerarToken(usuario);

    return res.json({
      mensagem: "Login realizado com sucesso",
      usuario,
      token,
    });
  } catch (erro) {
    console.error("Erro ao autenticar usuário:", erro);
    return res.status(500).json({ erro: "Não foi possível realizar o login" });
  }
}

async function perfil(req, res) {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, nome, email, criado_em FROM usuarios WHERE id = ? LIMIT 1",
      [req.usuario.id],
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.json({ usuario: usuarios[0] });
  } catch (erro) {
    console.error("Erro ao consultar usuário:", erro);
    return res.status(500).json({ erro: "Não foi possível consultar o usuário" });
  }
}

module.exports = { login, perfil, register };
