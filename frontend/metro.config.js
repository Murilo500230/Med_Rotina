const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    const proxyReq = http.request(
      {
        host: '127.0.0.1',
        port: 3000,
        path: req.url.slice(4),
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:3000' },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', () => {
      res.statusCode = 502;
      res.end();
    });
    req.pipe(proxyReq);
    return;
  }
  return middleware(req, res, next);
};

module.exports = config;
