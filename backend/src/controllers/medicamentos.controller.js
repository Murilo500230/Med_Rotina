const db = require("../config/db");

const HORARIO_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function obterId(req, res) {
  const texto = req.params.id;
  const id = Number(texto);
  if (!/^[1-9]\d*$/.test(texto) || !Number.isSafeInteger(id) || id > 2147483647) {
    res.status(400).json({ erro: "ID de medicamento inválido." });
    return null;
  }
  return id;
}

function validarCorpo(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { erro: "Envie um objeto JSON." };
  }

  const permitidos = ["nome", "dosagem", "frequencia", "horarios"];
  const extras = Object.keys(body).filter((chave) => !permitidos.includes(chave));
  if (extras.length) return { erro: `Campos não permitidos: ${extras.join(", ")}` };

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const dosagem = typeof body.dosagem === "string" ? body.dosagem.trim() : "";

  if (!nome || nome.length > 120) {
    return { erro: "O campo nome é obrigatório e deve ter no máximo 120 caracteres." };
  }
  if (!dosagem || dosagem.length > 100) {
    return { erro: "O campo dosagem é obrigatório e deve ter no máximo 100 caracteres." };
  }

  let horarios = null;
  if (body.horarios !== undefined) {
    if (!Array.isArray(body.horarios) || body.horarios.length === 0) {
      return { erro: "Informe pelo menos um horário." };
    }

    horarios = [...new Set(body.horarios.map((horario) =>
      typeof horario === "string" ? horario.trim() : "",
    ))].sort();

    if (horarios.some((horario) => !HORARIO_PATTERN.test(horario))) {
      return { erro: "Os horários devem usar o formato HH:MM." };
    }
  }

  const frequenciaInformada =
    typeof body.frequencia === "string" ? body.frequencia.trim() : "";
  const frequencia = frequenciaInformada || (horarios ? horarios.join(", ") : "");

  if (!frequencia || frequencia.length > 100) {
    return { erro: "Informe horários válidos ou uma frequência de até 100 caracteres." };
  }

  return { dados: { nome, dosagem, frequencia, horarios } };
}

function mapearMedicamento(linha) {
  const horarios = linha.horarios
    ? String(linha.horarios).split(",").filter(Boolean)
    : [];

  return {
    id: linha.id,
    nome: linha.nome,
    dosagem: linha.dosagem,
    frequencia: linha.frequencia,
    horarios,
  };
}

async function inserirHorarios(conn, medicamentoId, horarios) {
  if (!horarios || horarios.length === 0) return;

  const valores = horarios.map((horario) => [medicamentoId, `${horario}:00`]);
  await conn.query(
    "INSERT INTO doses (medicamento_id, horario) VALUES ?",
    [valores],
  );
}

exports.criar = async (req, res, next) => {
  const { dados, erro } = validarCorpo(req.body);
  if (erro) return res.status(400).json({ erro });

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [resultado] = await conn.execute(
      "INSERT INTO medicamentos (usuario_id, nome, dosagem, frequencia) VALUES (?, ?, ?, ?)",
      [req.usuario.id, dados.nome, dados.dosagem, dados.frequencia],
    );
    await inserirHorarios(conn, resultado.insertId, dados.horarios);
    await conn.commit();

    return res.status(201).location(`/medicamentos/${resultado.insertId}`).json({
      id: resultado.insertId,
      ...dados,
      horarios: dados.horarios || [],
    });
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

exports.listar = async (req, res, next) => {
  try {
    const [linhas] = await db.execute(
      `SELECT m.id, m.nome, m.dosagem, m.frequencia,
              GROUP_CONCAT(TIME_FORMAT(d.horario, '%H:%i') ORDER BY d.horario SEPARATOR ',') AS horarios
         FROM medicamentos m
         LEFT JOIN doses d ON d.medicamento_id = m.id
        WHERE m.usuario_id = ?
        GROUP BY m.id, m.nome, m.dosagem, m.frequencia
        ORDER BY m.id DESC`,
      [req.usuario.id],
    );
    return res.json(linhas.map(mapearMedicamento));
  } catch (err) {
    return next(err);
  }
};

exports.buscar = async (req, res, next) => {
  const id = obterId(req, res);
  if (id === null) return;

  try {
    const [linhas] = await db.execute(
      `SELECT m.id, m.nome, m.dosagem, m.frequencia,
              GROUP_CONCAT(TIME_FORMAT(d.horario, '%H:%i') ORDER BY d.horario SEPARATOR ',') AS horarios
         FROM medicamentos m
         LEFT JOIN doses d ON d.medicamento_id = m.id
        WHERE m.id = ? AND m.usuario_id = ?
        GROUP BY m.id, m.nome, m.dosagem, m.frequencia`,
      [id, req.usuario.id],
    );
    if (!linhas.length) {
      return res.status(404).json({ erro: "Medicamento não encontrado." });
    }
    return res.json(mapearMedicamento(linhas[0]));
  } catch (err) {
    return next(err);
  }
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
      "SELECT id FROM medicamentos WHERE id = ? AND usuario_id = ? FOR UPDATE",
      [id, req.usuario.id],
    );
    if (!linhas.length) {
      await conn.rollback();
      return res.status(404).json({ erro: "Medicamento não encontrado." });
    }

    await conn.execute(
      "UPDATE medicamentos SET nome = ?, dosagem = ?, frequencia = ? WHERE id = ? AND usuario_id = ?",
      [dados.nome, dados.dosagem, dados.frequencia, id, req.usuario.id],
    );

    if (dados.horarios) {
      await conn.execute("DELETE FROM doses WHERE medicamento_id = ?", [id]);
      await inserirHorarios(conn, id, dados.horarios);
    }

    await conn.commit();
    return res.json({
      id,
      nome: dados.nome,
      dosagem: dados.dosagem,
      frequencia: dados.frequencia,
      ...(dados.horarios ? { horarios: dados.horarios } : {}),
    });
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
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
      "DELETE FROM medicamentos WHERE id = ? AND usuario_id = ?",
      [id, req.usuario.id],
    );
    if (!resultado.affectedRows) {
      return res.status(404).json({ erro: "Medicamento não encontrado." });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
