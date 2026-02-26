const {
  findClientById,
  findClientByEmail,
  hashPassword,
  createClient,
  comparePassword,
  saveResetToken,
  findClientByToken,
} = require("../models/ClientModel");
const jwt = require("jsonwebtoken");
const db = require("../../db");
const crypto = require("crypto");

// ── Inscription ──

const register = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    const existingClient = await findClientByEmail(email);
    if (existingClient.length > 0) {
      return res
        .status(400)
        .json({ message: "L'adresse mail est déjà utilisée" });
    }

    const hash = await hashPassword(mot_de_passe);
    const result = await createClient({ email, mot_de_passe: hash });

    // Créer le JWT comme dans login
    const expire = parseInt(process.env.JWT_EXPIRES_IN, 10) || 3600;
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: expire },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: expire * 1000,
    });

    res.status(201).json({
      message: "Inscription réussie",
      client: {
        id: result.insertId,
        email,
        points_fidelite: 100,
      },
    });
  } catch (error) {
    console.error("Erreur enregistrement:", error);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
};

// ── Connexion
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const clients = await findClientByEmail(email);
    if (clients.length === 0) {
      return res.status(401).json({ message: "Identifiants incorrects" });
    }
    const client = clients[0];
    const isMatch = await comparePassword(mot_de_passe, client.MDP_CLIENT);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants incorrects" });
    }
    const expire = parseInt(process.env.JWT_EXPIRES_IN, 10) || 3600;
    const token = jwt.sign(
      { id: client.id_client, email: client.MAIL_CLIENT },
      process.env.JWT_SECRET,
      { expiresIn: expire },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: expire * 1000,
    });
    res.json({
      message: "Connexion réussie",
      client: {
        id: client.id_client,
        nom: client.NOM_CLIENT,
        prenom: client.PRENOM_CLIENT,
        email: client.MAIL_CLIENT,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

// ── Session courante (getMe) ──────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const clients = await findClientById(req.user.id); // ✅ corrigé : req.user au lieu de req.client
    if (clients.length === 0)
      return res.status(404).json({ message: "Client introuvable" });

    const client = clients[0];
    res.json({
      client: {
        id: client.id_client,
        nom: client.NOM_CLIENT,
        prenom: client.PRENOM_CLIENT,
        email: client.MAIL_CLIENT,
        adresse: client.ADRESSE_LIVRAISON,
        code_postal: client.CP_LIVRAISON,
        ville: client.VILLE_LIVRAISON,
        telephone: client.TELEPHONE_CLIENT,
        points_fidelite: client.points_fidelite,
        numero_fidelite: client.numero_fidelite,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur session" });
  }
};

// ── Récupérer un client par son id ───────────────────────────────────
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT
     id_client,
     PRENOM_CLIENT AS prenom,
     NOM_CLIENT AS nom,
     MAIL_CLIENT AS email,
     TELEPHONE_CLIENT AS telephone,
     ADRESSE_LIVRAISON AS adresse,
     CP_LIVRAISON AS code_postal,
     VILLE_LIVRAISON AS ville,
     ADRESSE_FACTURATION AS adresse_facturation,
     CP_FACTURATION AS code_postal_facturation,
     VILLE_FACTURATION AS ville_facturation,
     points_fidelite,
     numero_fidelite,
     date_inscription
   FROM client WHERE id_client = ?`,
      [parseInt(id)],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Client non trouvé" });
    res.json({ client: rows[0] });
  } catch (error) {
    console.error("Erreur SQL:", error.message);
    res.status(500).json({ message: "Erreur de récupération" });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      prenom,
      nom,
      telephone,
      adresse,
      code_postal,
      ville,
      adresse_facturation,
      code_postal_facturation,
      ville_facturation,
      mot_de_passe,
      mot_de_passe_actuel,
    } = req.body;

    let passHash = null;
    if (mot_de_passe && mot_de_passe.trim() !== "") {
      const [rows] = await db.query(
        "SELECT MDP_CLIENT FROM client WHERE id_client = ?",
        [parseInt(id)],
      );
      if (rows.length === 0)
        return res.status(404).json({ message: "Client non trouvé" });

      const isMatch = await comparePassword(
        mot_de_passe_actuel,
        rows[0].MDP_CLIENT,
      );
      if (!isMatch)
        return res
          .status(401)
          .json({ message: "Ancien mot de passe incorrect" });

      passHash = await hashPassword(mot_de_passe);
    }

    const query = `
      UPDATE client
      SET PRENOM_CLIENT = ?,
          NOM_CLIENT = ?,
          TELEPHONE_CLIENT = ?,
          ADRESSE_LIVRAISON = ?,
          CP_LIVRAISON = ?,
          VILLE_LIVRAISON = ?,
          ADRESSE_FACTURATION = ?,
          CP_FACTURATION = ?,
          VILLE_FACTURATION = ?
        ${passHash ? ", MDP_CLIENT = ?" : ""}
      WHERE id_client = ?`;

    const params = [
      prenom,
      nom,
      telephone,
      adresse,
      code_postal,
      ville,
      adresse_facturation,
      code_postal_facturation,
      ville_facturation,
    ];
    if (passHash) params.push(passHash);
    params.push(parseInt(id));

    await db.query(query, params);
    res.json({ message: "Profil mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur SQL Update:", error.message);
    res.status(500).json({ message: "Erreur de mise à jour" });
  }
};
// ── Déconnexion ──────────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "lax" });
  res.json({ message: "Déconnexion réussie" });
};

// ── Mot de passe oublié ──────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const clients = await findClientByEmail(email);
    if (clients.length > 0) {
      const token = crypto.randomBytes(20).toString("hex");
      const expires = Date.now() + 3600000;
      await saveResetToken(email, token, expires);
    }
    res.json({ message: "Si cet email existe, un lien a été envoyé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur" });
  }
};
// ── Vérifier l'ancien mot de passe ( fonction privée )
const checkPassword = async (req, res) => {
  try {
    const id = req.user.id;
    const { mot_de_passe_actuel } = req.body;

    const [rows] = await db.query(
      "SELECT MDP_CLIENT FROM client WHERE id_client = ?",
      [parseInt(id)],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Client non trouvé" });

    const isMatch = await comparePassword(
      mot_de_passe_actuel,
      rows[0].MDP_CLIENT,
    );
    if (!isMatch) return false;
    else if (isMatch) return true;
  } catch (error) {
    console.error("Erreur vérification mdp:", error.message);
  }
};
// ── Réinitialisation du mot de passe
const resetPassword = async (req, res) => {
  try {
    const { token, mot_de_passe } = req.body;
    const clients = await findClientByToken(token);
    if (clients.length === 0)
      return res.status(400).json({ message: "Lien invalide" });
    const hash = await hashPassword(mot_de_passe);
    await db.query(
      "UPDATE client SET MDP_CLIENT = ?, reset_token = NULL, reset_expires = NULL WHERE id_client = ?",
      [hash, clients[0].id_client],
    );
    res.json({ message: "Mot de passe modifié." });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getById,
  updateClient,
  checkPassword,
  forgotPassword,
  resetPassword,
};
