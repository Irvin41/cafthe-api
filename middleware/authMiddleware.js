// Middleware d'authentification JWT
// Vérifie que le token JWT est valide pour protéger les routes

const jwt = require("jsonwebtoken");
const { restart } = require("nodemon");

// verification du token

const verifyToken = (req, res, next) => {
  // Cherche le token dans le cookie HttpOnly
  let token = req.cookies && req.cookies.token;

  // header Authorization
  if (!token) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(403).json({ message: "Token manquant" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(403).json({ message: "Format de token invalide" });
    }

    token = parts[1];
  }

  // vérifier le token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token Expiré",
        });
      }
      return res.status(401).json({
        message: "Token Invalide",
      });
    }

    // Token valide : on ajoute les infos du client à la requête
    req.client = decoded;
    next();
  });
};

module.exports = { verifyToken };
