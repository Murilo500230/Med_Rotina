const db = require("../config/db");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONE_PATTERN = /^\+?[0-9\s().-]{8,20}$/;

function obterId(req, res) {
  const texto = req.params.id;
  const id = Number(texto);

  if (
    !/^[1-9]\d*$/.test(texto) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    res.status(400).json({ erro: "ID de cuidador inválido." });
    return null;
  }

  return id;
}

function validarCorpo(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { erro: "Envie um objeto JSON." };
  }

  const permitidos = ["nome", "contato"];
  const extras = Object.keys(body).filter((chave) => !permitidos.includes(chave));
  if (extras.length > 0) {
    return { erro: `Campos não permitidos: ${extras.join(", ")}` };
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const contato = typeof body.contato === "string" ? body.contato.trim() : "";

  if (!nome || nome.length > 120) {
    return { erro: "O campo nome é obrigatório e deve ter no máximo 120 caracteres." };
  }

  if (!contato || contato.length > 150) {
    return { erro: "O campo contato é obrigatório e deve ter no máximo 150 caracteres." };
  }

  const ehEmail = EMAIL_PATTERN.test(contato);
  const ehTelefone = TELEFONE_PATTERN.test(contato);

  if (!ehEmail && !ehTelefone) {
    return { erro: "O contato deve ser um e-mail válido ou um número de telefone válido." };
  }

  return { dados: { nome, contato } };
}

exports.criar = async (req, res, next) => {
  const validacao = validarCorpo(req.body);
  if (validacao.erro) {
    return res.status(400).json({ erro: validacao.erro });
  }

  const { nome, contato } = validacao.dados;

  try {
    const [resultado] = await db.execute(
      `INSERT INTO cuidadores (usuario_id, nome, contato)
       VALUES (?, ?, ?)`,
      [req.usuario.id, nome, contato]
    );

    return res.status(201).json({
      id: resultado.insertId,
      usuario_id: req.usuario.id,
      nome,
      contato
    });
  } catch (erro) {
    return next(erro);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const [linhas] = await db.execute(
      `SELECT id, nome, contato
         FROM cuidadores
        WHERE usuario_id = ?
        ORDER BY nome ASC, id ASC`,
      [req.usuario.id]
    );

    return res.json(linhas);
  } catch (erro) {
    return next(erro);
  }
};

exports.buscar = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;

  try {
    const [linhas] = await db.execute(
      `SELECT id, nome, contato
         FROM cuidadores
        WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: "Cuidador não encontrado." });
    }

    return res.json(linhas[0]);
  } catch (erro) {
    return next(erro);
  }
};

exports.atualizar = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;

  const validacao = validarCorpo(req.body);
  if (validacao.erro) {
    return res.status(400).json({ erro: validacao.erro });
  }

  const { nome, contato } = validacao.dados;

  try {
    const [resultado] = await db.execute(
      `UPDATE cuidadores
          SET nome = ?, contato = ?
        WHERE id = ? AND usuario_id = ?`,
      [nome, contato, id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Cuidador não encontrado." });
    }

    return res.json({
      id,
      nome,
      contato
    });
  } catch (erro) {
    return next(erro);
  }
};

exports.excluir = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;

  try {
    const [resultado] = await db.execute(
      `DELETE FROM cuidadores
        WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Cuidador não encontrado." });
    }

    return res.status(204).send();
  } catch (erro) {
    return next(erro);
  }
};
