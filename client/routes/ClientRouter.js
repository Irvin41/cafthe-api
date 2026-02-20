// CLIENT Router

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  getById,
  updateClient,
  resetPassword,
  forgotPassword,
} = require("../controllers/ClientController");
const { verifyToken } = require("../../middleware/authMiddleware");

// verification de session du client
// GET /api/client/me  ⚠️ AVANT /:id sinon "me" sera capturé comme un id
router.get("/me", verifyToken, getMe);

// Déconnexion
// POST /api/client/logout
router.post("/logout", logout);

// Inscription
// POST /api/client/register
router.post("/register", register);

// Connexion
// POST /api/client/login
router.post("/login", login);

// Récupérer un client par son id
// GET /api/client/:id
router.get("/:id", verifyToken, getById);

// Mettre à jour un client
// PUT /api/client/:id
router.put("/:id", verifyToken, updateClient);
// Nouvelles routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/:id", verifyToken, getById);
router.put("/:id", verifyToken, updateClient);

module.exports = router;
