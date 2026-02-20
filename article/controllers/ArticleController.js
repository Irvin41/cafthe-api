// Contrôleur articles
const {
  getALLArticles,
  getArticleById,
  getArticleByCategory,
  getBestSellers,
  getFavoriteProducts,
} = require("../models/ArticleModel");

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

const getBestSeller = async (req, res) => {
  try {
    const articles = await getBestSellers();

    res.json({
      message: "Articles importés avec succès",
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Erreur de récupération des articles best-sellers:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des articles",
    });
  }
};

const getFavoriteProduct = async (req, res) => {
  try {
    const { id_client } = req.params; // ou req.user.id si vous utilisez un middleware d'authentification
    const articles = await getFavoriteProducts(id_client);

    res.json({
      message: "Produits favoris récupérés avec succès",
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Erreur de récupération des produits favoris:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des produits favoris",
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

// Récupérer les produits par catégorie
const getByCategory = async (req, res) => {
  try {
    const { categorie } = req.params;
    const articles = await getArticleByCategory(categorie);

    res.json({
      message: `Article de la catégorie ${categorie}`,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error(
      "Erreur de récupération des articles triés par catégorie",
      error.message,
    );
    res.status(500).json({
      message: "Erreur de récupération des articles triés par catégorie",
    });
  }
};
module.exports = {
  getALL,
  getById,
  getByCategory,
  getBestSeller,
  getFavoriteProduct,
};
