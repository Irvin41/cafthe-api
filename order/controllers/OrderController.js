// Contrôleur commandes
const {
  getCommandesByClient,
  getCommandeById,
  createCommande,
  updateStatutCommande,
} = require("../models/OrderModel");
const db = require("../../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Récupérer toutes les commandes d'un client
const getByClient = async (req, res) => {
  try {
    const { id_client } = req.params;
    const commandes = await getCommandesByClient(id_client);
    res.json({
      message: "Commandes récupérées avec succès",
      count: commandes.length,
      commandes,
    });
  } catch (error) {
    console.error("Erreur de récupération des commandes", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des commandes" });
  }
};

// Récupérer une commande par son id
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const commande = await getCommandeById(parseInt(id));
    if (!commande) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }
    res.json({ message: "Commande récupérée avec succès", commande });
  } catch (error) {
    console.error("Erreur de récupération de la commande", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de la commande" });
  }
};
const checkout = async (req, res) => {
  try {
    const { id_client, articles } = req.body;

    if (!id_client || !articles || articles.length === 0) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    // 1. Créer la commande en BDD
    const commande = await createCommande(id_client, articles);

    // 2. Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(commande.total_ttc * 100), // en centimes
      currency: "eur",
      metadata: {
        id_commande: commande.id_commande.toString(),
        id_client: id_client.toString(),
      },
    });

    // 3. Sauvegarder le stripe_payment_intent_id
    await db.query(
      `UPDATE COMMANDE SET stripe_payment_intent_id = ? WHERE id_commande = ?`,
      [paymentIntent.id, commande.id_commande],
    );

    res.status(201).json({
      message: "Commande créée, paiement en attente",
      id_commande: commande.id_commande,
      clientSecret: paymentIntent.client_secret, // envoyé au frontend
    });
  } catch (error) {
    console.error("Erreur checkout", error.message);
    res.status(500).json({ message: "Erreur lors du checkout" });
  }
};
// ── NOUVEAU : Page de confirmation après redirect Stripe ──
const confirmation = async (req, res) => {
  try {
    const { payment_intent, redirect_status } = req.query;

    if (redirect_status !== "succeeded") {
      return res.status(400).json({ message: "Paiement échoué ou annulé" });
    }

    const [rows] = await db.query(
      `SELECT * FROM COMMANDE WHERE stripe_payment_intent_id = ?`,
      [payment_intent],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json({ message: "Paiement confirmé", commande: rows[0] });
  } catch (error) {
    console.error("Erreur confirmation", error.message);
    res.status(500).json({ message: "Erreur lors de la confirmation" });
  }
};
// Créer une nouvelle commande + mettre à jour les points fidélité
const create = async (req, res) => {
  try {
    const { id_client, articles } = req.body;

    if (!id_client || !articles || articles.length === 0) {
      return res.status(400).json({
        message: "Données manquantes : id_client et articles sont requis",
      });
    }

    const commande = await createCommande(id_client, articles);

    // ── Mise à jour points fidélité (1€ = 1 point) ──
    await db.query(
      `UPDATE client
       SET points_fidelite = (
         SELECT COALESCE(SUM(TOTAL), 0)
         FROM commande
         WHERE id_client = ?
       )
       WHERE id_client = ?`,
      [id_client, id_client],
    );

    res.status(201).json({ message: "Commande créée avec succès", commande });
  } catch (error) {
    console.error("Erreur de création de la commande", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la commande" });
  }
};

// Mettre à jour le statut + recalculer les points si LIVRE
const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = [
      "EN_ATTENTE",
      "EN_PREPARATION",
      "EXPEDIE",
      "LIVRE",
      "ANNULE",
    ];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs acceptées : ${statutsValides.join(", ")}`,
      });
    }

    const commande = await updateStatutCommande(parseInt(id), statut);
    if (!commande) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    // ── Recalcule les points si statut change (ex: annulation) ──
    await db.query(
      `UPDATE client
       SET points_fidelite = (
         SELECT COALESCE(SUM(TOTAL), 0)
         FROM commande
         WHERE id_client = ? AND STATUT != 'ANNULE'
       )
       WHERE id_client = ?`,
      [commande.id_client, commande.id_client],
    );

    res.json({ message: "Statut mis à jour avec succès", commande });
  } catch (error) {
    console.error("Erreur de mise à jour du statut", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour du statut" });
  }
};

module.exports = {
  getByClient,
  getById,
  create,
  updateStatut,
  checkout,
  confirmation,
};
