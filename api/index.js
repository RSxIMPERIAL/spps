// Vercel Serverless Function Bridge for SPPS
const { server } = require('../server/server');

module.exports = (req, res) => {
  return server.emit('request', req, res);
};
