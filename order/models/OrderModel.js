// model commande
const db = require("../../db");

const getCommandesByClient = async (id_client) => {
  const [commandes] = await db.query(
    `SELECT
       id_commande,
       DATE_COMMANDE  AS date_commande,
       STATUT         AS statut,
       TOTAL          AS total_ttc
     FROM commande
     WHERE id_client = ?
     ORDER BY DATE_COMMANDE DESC`,
    [id_client],
  );

  const commandesAvecArticles = await Promise.all(
    commandes.map(async (cmd) => {
      const [articles] = await db.query(
        "SELECT a.id_article, a.nom_article, a.image, c.`quantité` AS quantite FROM contenir c INNER JOIN article a ON c.id_article = a.id_article WHERE c.id_commande = ?",
        [cmd.id_commande],
      );
      return { ...cmd, articles };
    }),
  );

  return commandesAvecArticles;
};

const getCommandeById = async (id_commande) => {
  const [rows] = await db.query(
    `SELECT
       id_commande,
       id_client,
       DATE_COMMANDE  AS date_commande,
       STATUT         AS statut,
       TOTAL          AS total_ttc
     FROM commande
     WHERE id_commande = ?`,
    [id_commande],
  );
  if (rows.length === 0) return null;

  const [articles] = await db.query(
    "SELECT a.id_article, a.nom_article, a.image, c.`quantité` AS quantite FROM contenir c INNER JOIN article a ON c.id_article = a.id_article WHERE c.id_commande = ?",
    [id_commande],
  );

  return { ...rows[0], articles };
};

const createCommande = async (id_client, articles) => {
  const total = articles.reduce(
    (sum, a) => sum + a.prix_unitaire * a.quantite,
    0,
  );

  const [result] = await db.query(
    `INSERT INTO commande (id_client, DATE_COMMANDE, STATUT, TOTAL)
     VALUES (?, NOW(), 'EN_ATTENTE', ?)`,
    [id_client, total.toFixed(2)],
  );
  const id_commande = result.insertId;

  for (const article of articles) {
    await db.query(
      "INSERT INTO contenir (id_commande, id_article, `quantité`) VALUES (?, ?, ?)",
      [id_commande, article.id_article, article.quantite],
    );
  }

  return getCommandeById(id_commande);
};

const updateStatutCommande = async (id_commande, statut) => {
  await db.query(`UPDATE commande SET STATUT = ? WHERE id_commande = ?`, [
    statut,
    id_commande,
  ]);
  return getCommandeById(id_commande);
};

module.exports = {
  getCommandesByClient,
  getCommandeById,
  createCommande,
  updateStatutCommande,
};
