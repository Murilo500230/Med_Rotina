const db = require("../config/db");

const campos = 'id, nome, dosagem, frequencia';

function obterId(req, res) {
  const texto = req.params.id;
  const id = Number(texto);
  if (!/^[1-9]\d*$/.test(texto) || !Number.isSafeInteger(id) || id > 2147483647) {
    res.status(400).json({ erro: 'ID de medicamento inválido.' });
    return null;
  }
  return id;
}

function validarCorpo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erro: 'Envie um objeto JSON.' };
  }
  const limites = { nome: 120, dosagem: 100, frequencia: 100 };
  const extras = Object.keys(body).filter(chave => !(chave in limites));
  if (extras.length) return { erro: 'Campos não permitidos: ' + extras.join(', ') };
  const dados = {};
  for (const [campo, limite] of Object.entries(limites)) {
    if (typeof body[campo] !== 'string' || !body[campo].trim()) {
      return { erro: `O campo ${campo} é obrigatório e deve ser um texto não vazio.` };
    }
    dados[campo] = body[campo].trim();
    if ([...dados[campo]].length > limite) {
      return { erro: `O campo ${campo} deve ter no máximo ${limite} caracteres.` };
    }
  }
  return { dados };
}

exports.criar = async (req, res, next) => {
  const { dados, erro } = validarCorpo(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    const [resultado] = await db.execute(
      'INSERT INTO medicamentos (usuario_id, nome, dosagem, frequencia) VALUES (?, ?, ?, ?)',
      [req.usuario.id, dados.nome, dados.dosagem, dados.frequencia]
    );
    return res.status(201).location(`/medicamentos/${resultado.insertId}`)
      .json({ id: resultado.insertId, ...dados });
  } catch (err) { return next(err); }
};

exports.listar = async (req, res, next) => {
  try {
    const [linhas] = await db.execute(
      `SELECT ${campos} FROM medicamentos WHERE usuario_id = ? ORDER BY id DESC`,
      [req.usuario.id]
    );
    return res.json(linhas);
  } catch (err) { return next(err); }
};

exports.buscar = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;
  try {
    const [linhas] = await db.execute(
      `SELECT ${campos} FROM medicamentos WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id]
    );
    if (!linhas.length) return res.status(404).json({ erro: 'Medicamento não encontrado.' });
    return res.json(linhas[0]);
  } catch (err) { return next(err); }
};

exports.atualizar = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;
  const { dados, erro } = validarCorpo(req.body);
  if (erro) return res.status(400).json({ erro });
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [linhas] = await conn.execute(
      'SELECT id FROM medicamentos WHERE id = ? AND usuario_id = ? FOR UPDATE',
      [id, req.usuario.id]
    );
    if (!linhas.length) {
      await conn.rollback();
      return res.status(404).json({ erro: 'Medicamento não encontrado.' });
    }
    await conn.execute(
      'UPDATE medicamentos SET nome = ?, dosagem = ?, frequencia = ? WHERE id = ? AND usuario_id = ?',
      [dados.nome, dados.dosagem, dados.frequencia, id, req.usuario.id]
    );
    await conn.commit();
    return res.json({ id, ...dados });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackError) { console.error(rollbackError); }
    }
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

exports.excluir = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;
  try {
    const [resultado] = await db.execute(
      'DELETE FROM medicamentos WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ erro: 'Medicamento não encontrado.' });
    return res.status(204).send();
  } catch (err) { return next(err); }
};
