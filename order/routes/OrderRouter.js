// Router Commandes
// chemin : /api/commandes

const express = require("express");
const {
  getByClient,
  getById,
  create,
  updateStatut,
} = require("../controllers/OrderController");
const { verifyToken } = require("../../middleware/authMiddleware");
const router = express.Router();

// ⚠️ IMPORTANT : L'ordre des routes est CRUCIAL

// GET /api/commandes/client/:id_client - AVANT /:id
router.get("/client/:id_client", getByClient);

// GET /api/commandes/:id - récupérer une commande par son id
// ⚠️ DOIT ÊTRE EN DERNIER car capture tout ce qui n'a pas matché avant
router.get("/:id", getById);

// POST /api/commandes - créer une commande
router.post("/", create);

// PATCH /api/commandes/:id/statut - mettre à jour le statut
router.patch("/:id/statut", updateStatut);

module.exports = router;
