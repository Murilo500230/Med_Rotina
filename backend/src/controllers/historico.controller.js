const db = require("../config/db");
const { obterAgora } = require("../services/alertaService");

const DIAS_PADRAO = 7;
const DIAS_MAXIMO = 60;

function lerDias(texto) {
  if (texto === undefined) return DIAS_PADRAO;
  if (!/^[1-9]\d*$/.test(String(texto))) return null;
  const dias = Number(texto);
  return dias <= DIAS_MAXIMO ? dias : null;
}

// Mesma regra da T11: dose não tomada cujo horário já passou é "atrasada".
function statusDaDose(dose, agora) {
  if (dose.status === "tomada") return "tomada";
  if (dose.data < agora.data) return "atrasada";
  if (dose.data === agora.data && dose.horario < agora.horario) return "atrasada";
  return "pendente";
}

// T18: histórico de adesão por dia, lido de doses_diarias.
// Só aparecem dias em que as doses foram geradas (POST /doses/gerar).
exports.listar = async (req, res, next) => {
  const dias = lerDias(req.query.dias);
  if (dias === null) {
    return res
      .status(400)
      .json({ erro: `O parâmetro dias deve ser um inteiro de 1 a ${DIAS_MAXIMO}.` });
  }

  const agora = obterAgora();

  try {
    const [linhas] = await db.execute(
      `SELECT
         id,
         medicamento_id,
         nome_medicamento,
         dosagem,
         DATE_FORMAT(data, '%Y-%m-%d') AS data,
         TIME_FORMAT(horario, '%H:%i:%s') AS horario,
         status,
         CASE
           WHEN tomada_em IS NULL THEN NULL
           ELSE DATE_FORMAT(tomada_em, '%Y-%m-%dT%H:%i:%sZ')
         END AS tomada_em
       FROM doses_diarias
       WHERE usuario_id = ?
         AND data <= ?
         AND data >= DATE_SUB(?, INTERVAL ${dias - 1} DAY)
       ORDER BY data DESC, horario ASC, id ASC`,
      [req.usuario.id, agora.data, agora.data],
    );

    const porDia = new Map();
    for (const linha of linhas) {
      const dose = { ...linha, status: statusDaDose(linha, agora) };
      if (!porDia.has(dose.data)) porDia.set(dose.data, []);
      porDia.get(dose.data).push(dose);
    }

    let tomadasTotal = 0;
    let vencidasTotal = 0;

    const historico = [...porDia.entries()].map(([data, doses]) => {
      const tomadas = doses.filter((d) => d.status === "tomada").length;
      const atrasadas = doses.filter((d) => d.status === "atrasada").length;
      const pendentes = doses.length - tomadas - atrasadas;
      const vencidas = tomadas + atrasadas; // doses cujo horário já passou
      tomadasTotal += tomadas;
      vencidasTotal += vencidas;
      return {
        data,
        total: doses.length,
        tomadas,
        atrasadas,
        pendentes,
        adesao: vencidas > 0 ? Math.round((tomadas / vencidas) * 100) : null,
        doses,
      };
    });

    return res.json({
      dias,
      fuso: "America/Sao_Paulo",
      resumo: {
        tomadas: tomadasTotal,
        vencidas: vencidasTotal,
        adesao: vencidasTotal > 0 ? Math.round((tomadasTotal / vencidasTotal) * 100) : null,
      },
      historico,
    });
  } catch (erro) {
    return next(erro);
  }
};
