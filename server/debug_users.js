const db = require('better-sqlite3')('db/aarogya.db');
const users = db.prepare('SELECT * FROM users').all();
require('fs').writeFileSync('users_dump.json', JSON.stringify(users, null, 2));
