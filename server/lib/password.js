const bcrypt = require('bcryptjs');

// Seed/dev data in the new DB stores some passwords as plain text (not bcrypt
// hashes) — accept both so login keeps working against real seeded accounts.
async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

module.exports = { verifyPassword };
