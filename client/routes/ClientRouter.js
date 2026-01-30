// CLIENT Router

const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/ClientController");

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
