// Router Commandes
// chemin : /api/commandes

const express = require("express");
const {
  getByClient,
  getById,
  create,
  updateStatut,
  checkout, // ← ajouter
  confirmation, // ← ajouter
} = require("../controllers/OrderController");
const { verifyToken } = require("../../middleware/authMiddleware");
const router = express.Router();

// ⚠️ IMPORTANT : L'ordre des routes est CRUCIAL

// GET /api/commandes/client/:id_client - AVANT /:id
router.get("/client/:id_client", getByClient);

// GET /api/commandes/confirmation
router.get("/confirmation", confirmation); // ← ajouter

// GET /api/commandes/:id
router.get("/:id", getById);

// POST /api/commandes - créer une commande classique
router.post("/", create);

// POST /api/commandes/checkout - créer une commande + PaymentIntent Stripe
router.post("/checkout", checkout); // ← ajouter

// PATCH /api/commandes/:id/statut
router.patch("/:id/statut", updateStatut);

module.exports = router;
