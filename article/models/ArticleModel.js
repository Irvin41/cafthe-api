// model article

const db = require("../../db");

// Récupérer tout les article
const getALLArticles = async () => {
  const [rows] = await db.query("SELECT * FROM article");
  return rows;
};
// Récupérer un article par son ID
const getArticleById = async (id) => {
  const [rows] = await db.query("SELECT * FROM article WHERE id_article = ?", [
    id,
  ]);
  return rows;
};

// Récupérer un article pas sa catégorie
const getArticleByCategory = async (categorie) => {
  const [rows] = await db.query("SELECT * FROM article WHERE CATEGORIE = ?", [
    categorie,
  ]);
  return rows;
};
module.exports = { getALLArticles, getArticleById, getArticleByCategory };
