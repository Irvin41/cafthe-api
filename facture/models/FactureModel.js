// models/factureModel.js

const db = require("../../db");

// Récupère la facture + infos client
const getFactureByCommande = async (id_commande) => {
  const [rows] = await db.query(
    `
        SELECT f.*, 
               c.NOM_CLIENT, c.PRENOM_CLIENT,
               c.ADRESSE_FACTURATION, c.CP_FACTURATION, c.VILLE_FACTURATION,
               co.DATE_COMMANDE, co.MODE_PAIEMENT, co.remise_fidelite
        FROM FACTURE f
        JOIN COMMANDE co ON f.id_commande = co.id_commande
        JOIN CLIENT c ON co.id_client = c.id_client
        WHERE f.id_commande = ?
    `,
    [id_commande],
  );
  return rows[0];
};

// Récupère les articles d'une commande
const getLignesCommande = async (id_commande) => {
  const [rows] = await db.query(
    `
      SELECT a.nom_article, ct.\`quantité\` as quantite, ct.\`poids\`,
       a.prix_ht, a.taux_tva, a.prix_ttc
      FROM contenir ct
             JOIN article a ON ct.id_article = a.id_article
      WHERE ct.id_commande = ?
    `,
    [id_commande],
  );
  return rows;
};

// Crée une nouvelle facture en BDD
const createFacture = async (
  id_commande,
  montantHT,
  montantTVA,
  montantTTC,
  modePaiement,
) => {
  const [result] = await db.query(
    `
    INSERT INTO FACTURE (DATE_FACTURE, MONTANT_HT, MONTANT_TVA, MONTANT_TTC, STATUT_FACTURE, MODE_PAIEMENT, id_commande)
    VALUES (NOW(), ?, ?, ?, 'EMISE', ?, ?)
  `,
    [montantHT, montantTVA, montantTTC, modePaiement, id_commande],
  );
  return result.insertId;
};

module.exports = { getFactureByCommande, getLignesCommande, createFacture };
