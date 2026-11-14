const db = require("../config/db");
const alertaService = require("../services/alertaService");

exports.verificar = async (req, res, next) => {
  const tolerancia = req.body && Number.isInteger(Number(req.body.tolerancia_minutos))
    ? Number(req.body.tolerancia_minutos)
    : undefined;

  try {
    const resultado = await alertaService.verificarEDispararAlertas({
      usuarioId: req.usuario.id,
      toleranciaMinutos: tolerancia,
    });

    return res.json({
      mensagem: "Verificação de alertas executada com sucesso.",
      ...resultado,
    });
  } catch (erro) {
    return next(erro);
  }
};

exports.listarHistorico = async (req, res, next) => {
  try {
    const [linhas] = await db.execute(
      `SELECT
         id,
         cuidador_id,
         dose_diaria_id,
         nome_cuidador,
         contato_cuidador,
         nome_medicamento,
         dosagem,
         DATE_FORMAT(data_dose, '%Y-%m-%d') AS data_dose,
         TIME_FORMAT(horario_dose, '%H:%i:%s') AS horario_dose,
         minutos_atraso,
         mensagem,
         canal,
         status,
         DATE_FORMAT(enviado_em, '%Y-%m-%d %H:%i:%s') AS enviado_em
       FROM alertas_cuidadores
      WHERE usuario_id = ?
      ORDER BY enviado_em DESC, id DESC`,
      [req.usuario.id]
    );

    return res.json(linhas);
  } catch (erro) {
    return next(erro);
  }
};
