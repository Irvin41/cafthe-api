// Script one-shot : créer les factures manquantes pour toutes les commandes existantes
// Lancer avec : node seedFactures.js

require("dotenv").config();
const db = require("./db");
const { createFacture } = require("./facture/models/FactureModel");

const seed = async () => {
  // 1. Récupère toutes les commandes sans facture
  const [commandes] = await db.query(`
    SELECT co.id_commande, co.MODE_PAIEMENT
    FROM COMMANDE co
           LEFT JOIN FACTURE f ON co.id_commande = f.id_commande
    WHERE f.id_commande IS NULL
  `);

  console.log(`${commandes.length} commande(s) sans facture trouvée(s).`);

  for (const commande of commandes) {
    // 2. Récupère les lignes de la commande
    const [lignes] = await db.query(
      `SELECT a.prix_ht, a.taux_tva, a.prix_ttc, ct.\`quantité\` as quantite
       FROM contenir ct
              JOIN article a ON ct.id_article = a.id_article
       WHERE ct.id_commande = ?`,
      [commande.id_commande],
    );

    if (!lignes.length) {
      console.log(
        `⚠️  Commande ${commande.id_commande} sans articles, ignorée.`,
      );
      continue;
    }

    // 3. Calcule les montants
    const montantHT = lignes.reduce(
      (sum, l) => sum + l.prix_ht * l.quantite,
      0,
    );
    const montantTTC = lignes.reduce(
      (sum, l) => sum + l.prix_ttc * l.quantite,
      0,
    );
    const montantTVA = montantTTC - montantHT;

    // 4. Crée la facture
    const id = await createFacture(
      commande.id_commande,
      montantHT.toFixed(2),
      montantTVA.toFixed(2),
      montantTTC.toFixed(2),
      commande.MODE_PAIEMENT || "CARTE",
    );

    console.log(`Facture #${id} créée pour commande ${commande.id_commande}`);
  }

  console.log(" Seed terminé.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Erreur seed :", err);
  process.exit(1);
});
