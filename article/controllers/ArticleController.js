// Contrômeur articles
const { getALLArticles, getArticleById } = require("../models/ArticleModel");

// Récupérer tous les articles
const getALL = async (req, res) => {
  try {
    const article = await getALLArticles();
    res.json({
      message: "Articles importés avec succès",
      count: article.length,
      article,
    });
  } catch (error) {
    console.error("erreur de récupération des article", error.message);
    res.status(500).json({
      message: "erreur de récupération des article",
    });
  }
};

// Récupérer un article par son id
const getById = async (req, res) => {
  try {
    //const id = req.params.id;
    const { id } = req.params;
    const articleId = parseInt(id);

    const article = await getArticleById(articleId);

    if (article.length === 0) {
      return res.status(404).json({
        message: "Article Non trouvé",
      });
    }
    res.json({
      message: "article récupéré avec succès",
      article: article[0],
    });
  } catch (error) {
    console.error("erreur de récupération des article", error.message);
    res.status(500).json({
      message: "erreur de récupération de l'article",
    });
  }
};
module.exports = { getALL, getById };
