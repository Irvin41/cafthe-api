// CLIENT Router

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/ClientController");
const { verifyToken } = require("../../middleware/authMiddleware");

//verification de session du client
// route protégée
//GET/api/client/me
router.get("/me", verifyToken, getMe);

//Déconnexion
//Route protégée
//POST /api/client/logout
router.post("logout", logout);

// Inscription d'un client
//POST /api/client/register
// Body : { nom, prenom, email, mot_de_passe }
router.post("/register", register);

// Connexion
// POST /api/client/login
// body : {email, mot_de_passe}
// Retourne un token JWT
router.post("/login", login);

module.exports = router;
