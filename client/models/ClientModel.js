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

// --- NOUVEAU : Gérer les tokens de reset ---
const saveResetToken = async (email, token, expires) => {
  return await db.query(
    "UPDATE CLIENT SET reset_token = ?, reset_expires = ? WHERE MAIL_CLIENT = ?",
    [token, expires, email],
  );
};

const findClientByToken = async (token) => {
  const [rows] = await db.query(
    "SELECT * FROM CLIENT WHERE reset_token = ? AND reset_expires > ?",
    [token, Date.now()],
  );
  return rows;
};

// Créer un nouveau client
const createClient = async (clientData) => {
  const { email, mot_de_passe } = clientData;
  const [result] = await db.query(
    `INSERT INTO CLIENT ( MAIL_CLIENT, MDP_CLIENT, points_fidelite ) VALUES (?,?,?,?)`,
    [email, mot_de_passe, 100],
  );
  return result;
};

const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
  return await bcrypt.hash(password, rounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  findClientByEmail,
  createClient,
  hashPassword,
  comparePassword,
  findClientById,
  saveResetToken,
  findClientByToken,
};
