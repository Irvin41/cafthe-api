const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const {
  getFactureByCommande,
  getLignesCommande,
  createFacture,
} = require("../models/factureModel");

const FACTURES_DIR = path.join(__dirname, "..", "uploads", "factures");
if (!fs.existsSync(FACTURES_DIR)) {
  fs.mkdirSync(FACTURES_DIR, { recursive: true });
}

const getFactureData = async (req, res) => {
  const { id_commande } = req.params;
  try {
    const facture = await getFactureByCommande(id_commande);
    if (!facture) return res.status(404).json({ error: "Facture introuvable" });
    const lignes = await getLignesCommande(id_commande);
    res.json({ facture, lignes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération facture" });
  }
};

const creerFacture = async (req, res) => {
  const { id_commande, montantHT, montantTVA, montantTTC, modePaiement } =
    req.body;
  try {
    const id = await createFacture(
      id_commande,
      montantHT,
      montantTVA,
      montantTTC,
      modePaiement,
    );
    res.status(201).json({ message: "Facture créée", NUMERO_FACTURE: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création facture" });
  }
};

const sauvegarderPDF = async (req, res) => {
  const { numeroFacture, pdfBase64 } = req.body;
  try {
    const nomFichier = `facture_${String(numeroFacture).padStart(6, "0")}.pdf`;
    const cheminFichier = path.join(FACTURES_DIR, nomFichier);
    if (fs.existsSync(cheminFichier)) {
      return res.json({
        message: "Facture déjà sauvegardée",
        fichier: nomFichier,
      });
    }
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    fs.writeFileSync(cheminFichier, pdfBuffer);
    console.log(`✅ Facture sauvegardée : ${nomFichier}`);
    res.json({ message: "Facture sauvegardée", fichier: nomFichier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur sauvegarde PDF" });
  }
};

const htmlToPDF = async (req, res) => {
  const { html, css, numeroFacture } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    const htmlComplet = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

    await page.setContent(htmlComplet, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const nomFichier = `facture_${String(numeroFacture).padStart(6, "0")}.pdf`;
    const cheminFichier = path.join(FACTURES_DIR, nomFichier);
    if (!fs.existsSync(cheminFichier)) {
      fs.writeFileSync(cheminFichier, pdfBuffer);
      console.log(`✅ Facture sauvegardée : ${nomFichier}`);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${nomFichier}`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur génération PDF" });
  }
};

module.exports = { getFactureData, creerFacture, sauvegarderPDF, htmlToPDF };
