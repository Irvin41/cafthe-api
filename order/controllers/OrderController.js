// Contrôleur commandes
const {
  getCommandesByClient,
  getCommandeById,
  createCommande,
  updateStatutCommande,
} = require("../models/OrderModel");
const db = require("../../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createFacture } = require("../../facture/models/FactureModel");

// Helper : calcule et crée la facture pour une commande
const genererFacture = async (id_commande, modePaiement) => {
  const [lignes] = await db.query(
    `SELECT a.prix_ht, a.taux_tva, a.prix_ttc, ct.\`quantité\` as quantite
     FROM contenir ct
            JOIN article a ON ct.id_article = a.id_article
     WHERE ct.id_commande = ?`,
    [id_commande],
  );

  if (!lignes.length) return null;

  const montantHT = lignes.reduce((sum, l) => sum + l.prix_ht * l.quantite, 0);
  const montantTTC = lignes.reduce(
    (sum, l) => sum + l.prix_ttc * l.quantite,
    0,
  );
  const montantTVA = montantTTC - montantHT;

  return await createFacture(
    id_commande,
    montantHT.toFixed(2),
    montantTVA.toFixed(2),
    montantTTC.toFixed(2),
    modePaiement || "CARTE",
  );
};

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

// Créer une commande + PaymentIntent Stripe
const checkout = async (req, res) => {
  try {
    const {
      id_client,
      articles,
      remise_fidelite = 0,
      mode_paiement = "Carte Bancaire",
    } = req.body;

    if (!id_client || !articles || articles.length === 0) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    const commande = await createCommande(id_client, articles);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(commande.total_ttc * 100),
      currency: "eur",
      metadata: {
        id_commande: commande.id_commande.toString(),
        id_client: id_client.toString(),
      },
    });

    await db.query(
      `UPDATE COMMANDE SET stripe_payment_intent_id = ?, remise_fidelite = ?, MODE_PAIEMENT = ? WHERE id_commande = ?`,
      [paymentIntent.id, remise_fidelite, mode_paiement, commande.id_commande],
    );

    // ── Facture auto ──
    await genererFacture(commande.id_commande, mode_paiement);
    console.log(`✅ Facture créée pour commande ${commande.id_commande}`);

    res.status(201).json({
      message: "Commande créée, paiement en attente",
      id_commande: commande.id_commande,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erreur checkout", error.message);
    res.status(500).json({ message: "Erreur lors du checkout" });
  }
};

// Page de confirmation après redirect Stripe
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

// Créer une nouvelle commande + points fidélité
const create = async (req, res) => {
  try {
    const {
      id_client,
      articles,
      remise_fidelite = 0,
      mode_paiement = "Paiement au comptoir",
    } = req.body;

    if (!id_client || !articles || articles.length === 0) {
      return res.status(400).json({
        message: "Données manquantes : id_client et articles sont requis",
      });
    }

    const commande = await createCommande(id_client, articles);

    await db.query(
      `UPDATE COMMANDE SET remise_fidelite = ?, MODE_PAIEMENT = ? WHERE id_commande = ?`,
      [remise_fidelite, mode_paiement, commande.id_commande],
    );

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

    await genererFacture(commande.id_commande, mode_paiement);
    console.log(`✅ Facture créée pour commande ${commande.id_commande}`);

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
