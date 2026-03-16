// routes/factureRoute.js

const express = require("express");
const router = express.Router();
const {
  getFactureData,
  creerFacture,
  sauvegarderPDF,
  htmlToPDF,
} = require("../controllers/FactureController");

router.post("/html-to-pdf", htmlToPDF);
router.post("/", creerFacture);
router.post("/sauvegarder", sauvegarderPDF);
router.get("/:id_commande", getFactureData);

module.exports = router;
