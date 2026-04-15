const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const TTL    = '30d';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TTL });
}

function verify(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired
}

module.exports = { sign, verify };
