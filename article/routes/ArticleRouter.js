// Router Articles
// chemin : /api/articles

const express = require("express");
const {
  getALL,
  getById,
  getByCategory,
} = require("../controllers/ArticleController");
const { getArticleByCategory } = require("../models/ArticleModel");
const { verifyToken } = require("../../middleware/authMiddleware");
const router = express.Router();

// GET /api/articles - récupérer tout les articles
router.get("/", verifyToken, getALL);

// GET /api/article/:id - récupérer un artcile par son id
router.get("/:id", getById);

// GET /api/article/categorie/:categorie - récupérer les articles d'une catégorie
router.get("/categorie/:categorie", getByCategory);

module.exports = router;
