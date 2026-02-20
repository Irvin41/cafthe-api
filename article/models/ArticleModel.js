// model article

const db = require("../../db");

// Récupérer tous les articles
const getALLArticles = async () => {
  const [rows] = await db.query(
    `SELECT 
      id_article, 
      nom_article, 
      categorie,
      description,
      type_vente,
      prix_ht,
      taux_tva,
      prix_ttc, 
      stock,
      image, 
      origine 
    FROM article 
    ORDER BY id_article`,
  );
  console.log(rows);
  return rows;
};

// Récupérer un article par son ID
const getArticleById = async (id) => {
  const [rows] = await db.query(
    `SELECT
       id_article,
       nom_article,
       categorie,
       description,
       description_detaillee,
       type_vente,
       prix_ht,
       taux_tva,
       prix_ttc,
       stock,
       image,
       origine
     FROM article
     WHERE id_article = ?`,
    [id],
  );

  return rows;
};

// Récupérer un article par sa catégorie
const getArticleByCategory = async (categorie) => {
  const [rows] = await db.query(
    `SELECT 
      id_article, 
      nom_article, 
      categorie,
      description,
      type_vente,
      prix_ht,
      taux_tva,
      prix_ttc, 
      stock,
      image, 
      origine 
    FROM article 
    WHERE categorie = ?`,
    [categorie],
  );
  return rows;
};

// Récupérer les 3 meilleures ventes
const getBestSellers = async () => {
  const [rows] = await db.query(
    `SELECT
       article.id_article,
       article.nom_article,
       article.categorie,
       article.description,
       article.type_vente,
       article.prix_ht,
       article.taux_tva,
       article.prix_ttc,
       article.stock,
       article.image,
       article.origine,
       SUM(contenir.quantité) as total_quantité
     FROM contenir
            INNER JOIN article ON contenir.id_article = article.id_article
     GROUP BY
       article.id_article,
       article.nom_article,
       article.categorie,
       article.description,
       article.type_vente,
       article.prix_ht,
       article.taux_tva,
       article.prix_ttc,
       article.stock,
       article.image,
       article.origine
     ORDER BY total_quantité DESC
       LIMIT 3`,
  );
  return rows;
};

// Récupérer les produits favoris d'un client
const getFavoriteProducts = async (id_client) => {
  const [rows] = await db.query(
    `SELECT
       article.id_article,
       article.nom_article,
       article.categorie,
       article.description,
       article.type_vente,
       article.prix_ht,
       article.taux_tva,
       article.prix_ttc,
       article.stock,
       article.image,
       article.origine,
       SUM(contenir.quantité) as total_quantité
     FROM contenir
            INNER JOIN commande ON contenir.id_commande = commande.id_commande
            INNER JOIN article ON contenir.id_article = article.id_article
     WHERE commande.id_client = ?
     GROUP BY
       article.id_article,
       article.nom_article,
       article.categorie,
       article.description,
       article.type_vente,
       article.prix_ht,
       article.taux_tva,
       article.prix_ttc,
       article.stock,
       article.image,
       article.origine
     ORDER BY total_quantité DESC
       LIMIT 3`,
    [id_client],
  );
  return rows;
};

module.exports = {
  getALLArticles,
  getArticleById,
  getArticleByCategory,
  getBestSellers,
  getFavoriteProducts,
};
