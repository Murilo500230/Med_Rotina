const db = require("../config/db");
const nodemailer = require("nodemailer");

const FUSO = "America/Sao_Paulo";
const TOLERANCIA_PADRAO_MINUTOS = 30;

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
    partes.map(({ type, value }) => [type, value])
  );

  return {
    data: `${valores.year}-${valores.month}-${valores.day}`,
    horario: `${valores.hour}:${valores.minute}:${valores.second}`,
    dataHoraStr: `${valores.year}-${valores.month}-${valores.day} ${valores.hour}:${valores.minute}:${valores.second}`,
    timestamp: new Date(`${valores.year}-${valores.month}-${valores.day}T${valores.hour}:${valores.minute}:${valores.second}`),
  };
}

let transporter = null;

function obterTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function enviarEmailOuSimular({ para, assunto, texto }) {
  const mailer = obterTransporter();
  const remetente = process.env.EMAIL_FROM || "alerta@medrotina.com.br";

  if (mailer && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) {
    try {
      await mailer.sendMail({
        from: `"MedRotina Alertas" <${remetente}>`,
        to: para,
        subject: assunto,
        text: texto,
      });
      return { canal: "email", status: "enviado" };
    } catch (erro) {
      console.warn(`[T14 - Alerta] Falha no envio SMTP para ${para}:`, erro.message);
      return { canal: "email", status: "falha", erro: erro.message };
    }
  }

  // Modo simulação para ambiente de testes / sem servidor SMTP externo configurado
  const ehEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para);
  console.log(`[T14 - Alerta Simulado] Enviando aviso para ${para} via ${ehEmail ? 'e-mail' : 'telefone/SMS'}:`);
  console.log(`Assunto: ${assunto}`);
  console.log(`Mensagem:\n${texto}`);

  return { canal: ehEmail ? "email" : "sms", status: "simulado" };
}

/**
 * Identifica doses não confirmadas após o prazo e dispara avisos aos cuidadores.
 * @param {Object} options
 * @param {number|null} [options.usuarioId] - Filtrar por usuário específico ou verificar geral.
 * @param {number} [options.toleranciaMinutos] - Tolerância após o horário previsto (padrão 30 min).
 */
async function verificarEDispararAlertas(options = {}) {
  const agora = obterAgora();
  const tolerancia = Number.isInteger(options.toleranciaMinutos) && options.toleranciaMinutos >= 0
    ? options.toleranciaMinutos
    : (Number(process.env.ALERTA_TOLERANCIA_MINUTOS) || TOLERANCIA_PADRAO_MINUTOS);

  const usuarioId = options.usuarioId || null;

  // Busca doses diárias pendentes que já ultrapassaram o horário limite (horario + tolerância)
  // e cujos cuidadores ainda não receberam alerta para essa ocorrência.
  const queryDoses = `
    SELECT
      dd.id AS dose_diaria_id,
      dd.usuario_id,
      u.nome AS nome_usuario,
      dd.nome_medicamento,
      dd.dosagem,
      DATE_FORMAT(dd.data, '%Y-%m-%d') AS data_dose,
      TIME_FORMAT(dd.horario, '%H:%i:%s') AS horario_dose,
      TIMESTAMPDIFF(MINUTE, TIMESTAMP(dd.data, dd.horario), TIMESTAMP(?, ?)) AS minutos_atraso
    FROM doses_diarias dd
    INNER JOIN usuarios u ON u.id = dd.usuario_id
    WHERE (dd.status != 'tomada' AND dd.tomada_em IS NULL)
      AND (
        dd.data < ?
        OR (
          dd.data = ?
          AND TIMESTAMPADD(MINUTE, ?, dd.horario) <= ?
        )
      )
      ${usuarioId ? "AND dd.usuario_id = ?" : ""}
    ORDER BY dd.data ASC, dd.horario ASC
  `;

  const paramsDoses = [
    agora.data,
    agora.horario,
    agora.data,
    agora.data,
    tolerancia,
    agora.horario,
  ];

  if (usuarioId) {
    paramsDoses.push(usuarioId);
  }

  const [dosesAtrasadas] = await db.execute(queryDoses, paramsDoses);

  const alertasGerados = [];

  for (const dose of dosesAtrasadas) {
    // Busca os cuidadores do usuário que ainda não foram alertados sobre esta dose
    const [cuidadores] = await db.execute(
      `SELECT c.id, c.nome, c.contato
         FROM cuidadores c
        WHERE c.usuario_id = ?
          AND c.id NOT IN (
            SELECT ac.cuidador_id
              FROM alertas_cuidadores ac
             WHERE ac.dose_diaria_id = ?
          )`,
      [dose.usuario_id, dose.dose_diaria_id]
    );

    for (const cuidador of cuidadores) {
      const atraso = Math.max(dose.minutos_atraso, tolerancia);
      const mensagem = `Olá, ${cuidador.nome}! Atenção: o paciente ${dose.nome_usuario} possui a dose do medicamento "${dose.nome_medicamento}" (${dose.dosagem}) prevista para ${dose.horario_dose} em ${dose.data_dose} que ainda não foi confirmada (atraso de aprox. ${atraso} minutos). Por favor, verifique com o paciente.`;
      const assunto = `[MedRotina] Alerta: Dose de ${dose.nome_medicamento} não confirmada`;

      const envio = await enviarEmailOuSimular({
        para: cuidador.contato,
        assunto,
        texto: mensagem,
      });

      const [resInsert] = await db.execute(
        `INSERT INTO alertas_cuidadores (
           usuario_id,
           cuidador_id,
           dose_diaria_id,
           nome_cuidador,
           contato_cuidador,
           nome_medicamento,
           dosagem,
           data_dose,
           horario_dose,
           minutos_atraso,
           mensagem,
           canal,
           status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dose.usuario_id,
          cuidador.id,
          dose.dose_diaria_id,
          cuidador.nome,
          cuidador.contato,
          dose.nome_medicamento,
          dose.dosagem,
          dose.data_dose,
          dose.horario_dose,
          atraso,
          mensagem,
          envio.canal,
          envio.status,
        ]
      );

      alertasGerados.push({
        id: resInsert.insertId,
        dose_diaria_id: dose.dose_diaria_id,
        cuidador_id: cuidador.id,
        nome_cuidador: cuidador.nome,
        contato_cuidador: cuidador.contato,
        nome_medicamento: dose.nome_medicamento,
        data_dose: dose.data_dose,
        horario_dose: dose.horario_dose,
        minutos_atraso: atraso,
        canal: envio.canal,
        status: envio.status,
      });
    }
  }

  return {
    executado_em: agora.dataHoraStr,
    fuso: FUSO,
    tolerancia_minutos: tolerancia,
    total_doses_atrasadas: dosesAtrasadas.length,
    total_alertas_gerados: alertasGerados.length,
    alertas: alertasGerados,
  };
}

let intervaloHandle = null;

function iniciarRotinaAlertas(minutos = 5) {
  if (intervaloHandle) return;

  const ms = Math.max(minutos, 1) * 60 * 1000;
  console.log(`[T14 - Rotina de Alertas] Iniciada no servidor com intervalo de ${minutos} minuto(s).`);

  intervaloHandle = setInterval(async () => {
    try {
      const res = await verificarEDispararAlertas();
      if (res.total_alertas_gerados > 0) {
        console.log(`[T14 - Rotina de Alertas] ${res.total_alertas_gerados} alerta(s) disparado(s) com sucesso.`);
      }
    } catch (err) {
      console.error("[T14 - Rotina de Alertas] Erro ao verificar alertas:", err.message);
    }
  }, ms);

  if (intervaloHandle.unref) {
    intervaloHandle.unref();
  }
}

function pararRotinaAlertas() {
  if (intervaloHandle) {
    clearInterval(intervaloHandle);
    intervaloHandle = null;
  }
}

module.exports = {
  obterAgora,
  verificarEDispararAlertas,
  iniciarRotinaAlertas,
  pararRotinaAlertas,
};
