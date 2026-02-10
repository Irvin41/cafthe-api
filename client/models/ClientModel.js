// model Client

const db = require("../../db");
const bcrypt = require("bcryptjs");

//rechercher un client par son id
const findClientById = async (id) => {
  const [rows] = await db.query("SELECT * FROM client WHERE id_client = ?", [
    id,
  ]);
  return rows;
};

// rechercher un client par son e-mail
const findClientByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM CLIENT WHERE MAIL_CLIENT = ?", [
    email,
  ]);
  return rows;
};

// Créer un nouveau client
const createClient = async (clientData) => {
  const {
    nom,
    prenom,
    adresse_livraison,
    cp_livraison,
    ville_livraison,
    adresse_de_facturation,
    cp_facturation,
    ville_facturation,
    telephone,
    email,
    mot_de_passe,
  } = clientData;

  const [result] = await db.query(
    `INSERT INTO CLIENT (NOM_CLIENT, PRENOM_CLIENT, ADRESSE_LIVRAISON,
  CP_LIVRAISON, VILLE_LIVRAISON, ADRESSE_FACTURATION, CP_FACTURATION, VILLE_FACTURATION,
  TELEPHONE_CLIENT, MAIL_CLIENT, MDP_CLIENT) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      nom,
      prenom,
      adresse_livraison || null,
      cp_livraison || null,
      ville_livraison || null,
      adresse_de_facturation || null,
      cp_facturation || null,
      ville_facturation || null,
      telephone || null,
      email,
      mot_de_passe,
    ],
  );
  return result;
};
// Hacher un mot de passe
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
  return await bcrypt.hash(password, rounds);

  // AUTRE TECHNIQUE : return await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));
};

// Comparer un mot de passe
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
module.exports = {
  findClientByEmail,
  createClient,
  hashPassword,
  comparePassword,
  findClientById,
};
