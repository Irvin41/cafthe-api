// Router Articles
// chemin : /api/articles

const express = require("express");
const { getALL, getById } = require("../controllers/ArticleController");
const router = express.Router();

// GET /api/articles - récupérer tout les articles
router.get("/", getALL);

// GET /api/article/:id - récupérer un artcile par son id
router.get("/:id", getById);
module.exports = router;
