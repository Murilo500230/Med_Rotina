const jwt = require('jsonwebtoken');

module.exports = function autenticarMedicamentos(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ erro: 'Autenticação não configurada no servidor.' });
  }
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ erro: 'Envie um token Bearer válido.' });

  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
    // Contrato proposto: o login coloca o ID do usuário no campo sub.
    const rawId = payload && payload.sub;
    if (typeof rawId !== 'string' || !/^[1-9]\d*$/.test(rawId)) {
      return res.status(401).json({ erro: 'Token sem identificação válida do usuário.' });
    }
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id > 2147483647) {
      return res.status(401).json({ erro: 'Identificação inválida no token.' });
    }
    req.usuario = { id };
    return next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
