require('dotenv').config();
const mysql = require("mysql2");

let poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root12345678",
  database: process.env.DB_NAME || "osint_tools",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DATABASE_URL) {
  const match = process.env.DATABASE_URL.match(/mysql:\/\/([^:]+):?(.*)?@([^:/]+):?(\d+)?\/(.+)/);
  if (match) {
    const [, user, password = '', host = 'localhost', port = '3306', database = 'osint_tools'] = match;
    poolConfig.user = user;
    if (password) {
      poolConfig.password = password;
    }
    poolConfig.host = host;
    poolConfig.port = Number(port);
    poolConfig.database = database;
  }
}

const db = mysql.createPool(poolConfig);

module.exports = db.promise();