const db = require("../config/db");

const FUSO = "America/Sao_Paulo";

function obterAgora() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value]),
  );

  return {
    data: `${valores.year}-${valores.month}-${valores.day}`,
    horario: `${valores.hour}:${valores.minute}:${valores.second}`,
  };
}

exports.gerar = async (req, res, next) => {
  const agora = obterAgora();

  try {
    await db.execute(
      `INSERT INTO doses_diarias (
         usuario_id,
         medicamento_id,
         nome_medicamento,
         dosagem,
         data,
         horario
       )
       SELECT
         m.usuario_id,
         m.id,
         m.nome,
         m.dosagem,
         ?,
         d.horario
       FROM medicamentos m
       INNER JOIN doses d ON d.medicamento_id = m.id
       WHERE m.usuario_id = ?
       ON DUPLICATE KEY UPDATE
         id = doses_diarias.id`,
      [agora.data, req.usuario.id],
    );

    const [linhas] = await db.execute(
      `SELECT COUNT(*) AS total
         FROM doses_diarias
        WHERE usuario_id = ? AND data = ?`,
      [req.usuario.id, agora.data],
    );

    return res.json({
      mensagem: "Doses do dia geradas. Registros existentes foram preservados.",
      data: agora.data,
      fuso: FUSO,
      total: linhas[0].total,
    });
  } catch (erro) {
    return next(erro);
  }
};

exports.listarHoje = async (req, res, next) => {
  const agora = obterAgora();

  try {
    const [doses] = await db.execute(
      `SELECT
         id,
         medicamento_id,
         nome_medicamento,
         dosagem,
         DATE_FORMAT(data, '%Y-%m-%d') AS data,
         TIME_FORMAT(horario, '%H:%i:%s') AS horario,
         CASE
           WHEN status = 'tomada' THEN 'tomada'
           WHEN horario < ? THEN 'atrasada'
           ELSE 'pendente'
         END AS status,
         CASE
           WHEN tomada_em IS NULL THEN NULL
           ELSE DATE_FORMAT(tomada_em, '%Y-%m-%dT%H:%i:%sZ')
         END AS tomada_em
       FROM doses_diarias
       WHERE usuario_id = ? AND data = ?
       ORDER BY horario, id`,
      [agora.horario, req.usuario.id, agora.data],
    );

    return res.json({
      data: agora.data,
      fuso: FUSO,
      doses,
    });
  } catch (erro) {
    return next(erro);
  }
};

exports.tomar = async (req, res, next) => {
  const texto = req.params.id;
  const id = Number(texto);

  if (
    !/^[1-9]\d*$/.test(texto) ||
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return res.status(400).json({ erro: "ID de dose inválido." });
  }

  const agora = obterAgora();

  try {
    await db.execute(
      `UPDATE doses_diarias
          SET status = 'tomada',
              tomada_em = COALESCE(tomada_em, UTC_TIMESTAMP())
        WHERE id = ?
          AND usuario_id = ?
          AND (
            data < ?
            OR (data = ? AND horario <= ?)
          )`,
      [id, req.usuario.id, agora.data, agora.data, agora.horario],
    );

    const [linhas] = await db.execute(
      `SELECT
         id,
         status,
         DATE_FORMAT(tomada_em, '%Y-%m-%dT%H:%i:%sZ') AS tomada_em
       FROM doses_diarias
       WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id],
    );

    if (!linhas.length) {
      return res.status(404).json({ erro: "Dose não encontrada." });
    }

    if (linhas[0].status !== "tomada") {
      return res.status(409).json({
        erro: "Não é permitido confirmar uma dose antes do horário previsto.",
      });
    }

    return res.json(linhas[0]);
  } catch (erro) {
    return next(erro);
  }
};
