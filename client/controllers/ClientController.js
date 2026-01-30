// Contrôleur CLIENT
const {
  findClientByEmail,
  hashPassword,
  createClient,
  comparePassword,
} = require("../models/ClientModel");
const jwt = require("jsonwebtoken");
// Inscription

const register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe } = req.body;
    // vérifier si l'email existe deja
    const existingClient = await findClientByEmail(email);

    if (existingClient.length > 0) {
      return res.status(400).json({
        message: "L'adresse mail est déjà utilisée",
      });
    }

    // Hacher mot de passe
    const hash = await hashPassword(mot_de_passe);

    // Créer le Client

    const result = await createClient({
      nom,
      prenom,
      email,
      mot_de_passe: hash,
    });
    res.status(201).json({
      message: "Inscription réussie",
      client_id: result.insertId,
      client: { nom, prenom, email },
    });
  } catch (error) {
    console.error("Erreur inscription", error.message);
    res.status(500).json({
      message: "Erreur lors de l'inscription",
    });
  }
};

//connexion
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // rechercher client
    const clients = await findClientByEmail(email);

    if (clients.length === 0) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }
    const client = clients[0];

    // verifier le mot de passe
    const isMatch = await comparePassword(mot_de_passe, client.MDP_CLIENT);

    if (!isMatch) {
      return res.status(401).json({
        message: "Identifiant incorrects, veuillez réessayer",
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: client.id_client,
        email: client.MAIL_CLIENT,
      },
      process.env.JWT_SECRET,
      // { expiresIn: process.envJWT_EXPIRES_IN || "1h" },
    );

    res.json({
      message: "connexion réussie",
      token,
      client: {
        id: client.id_client,
        nom: client.NOM_CLIENT,
        prenom: client.PRENOM_CLIENT,
        email: client.MAIL_CLIENT,
      },
    });
  } catch (error) {
    console.error("Erreur connexion utilisateur", error.message);
    res.status(500).json({
      message: "Erreur lors de la connexion",
    });
  }
};
module.exports = { register, login };
