// permet de configurer le pool de connexion a MySQL
// permet de faire des requêtes assynchrones async/ await

const mysql = require("mysql2/promise");
require("dotenv").config();

// POOL de conexion
// permet de gerer plusieurs connexion simultanées
// réutiliser les connexions existantes
// gestion automatique de la disponibilité
// limite le nbe de connexion ( en même temps )

const db = mysql.createPool({
  // paramètre de connexion ( host, nom utilisateu MDP nom de la BDD
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // paramètre du pool
  // si plus de connexion dispo alors elles attendent
  waitForConnections: true,

  // parametre de limiter le nbe MAX de co
  connectionLimit: 10,

  // paramètres optionnel mais recommandé
  // en cas d'échec de co, rééssayer
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // timeout de connexion
  connectTimeout: 10000, // 10s
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connecté à la base de données MySql");

    // Se deconnecte

    connection.release();
  } catch (err) {
    console.error("erreur de connection à MySql : ", err.message);

    // arrete l'app avec code erreur 1
    process.exit(1);
  }
})();

module.exports = db;
