// Router Articles
// chemin : /api/articles

const express = require("express");
const {
  getALL,
  getById,
  getByCategory,
  getBestSeller,
  getFavoriteProduct, // ← controller, pas le model directement
} = require("../controllers/ArticleController");
const { verifyToken } = require("../../middleware/authMiddleware");
const router = express.Router();

// GET /api/articles
router.get("/", getALL);

// GET /api/articles/bestseller - AVANT /:id
router.get("/bestseller", getBestSeller);

// GET /api/articles/favoris/:id_client - AVANT /:id
router.get("/favoris/:id_client", getFavoriteProduct); // ← controller

// GET /api/articles/categorie/:categorie - AVANT /:id
router.get("/categorie/:categorie", getByCategory);

// GET /api/articles/:id - EN DERNIER
router.get("/:id", getById);

module.exports = router;
