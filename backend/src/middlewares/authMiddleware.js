const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ erro: "JWT_SECRET não configurado no servidor" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: Number(payload.sub),
      nome: payload.nome,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

module.exports = autenticar;
