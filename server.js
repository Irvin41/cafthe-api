const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
// permet de charger les variable d'environnement depuis .env
require("dotenv").config();

// connexion à la BDD
const db = require("./db");

// === importation des routes ===
const articlesRoutes = require("./article/routes/ArticleRouter");
const clientRoutes = require("./client/routes/ClientRouter");
// création de l'app express
const app = express();

// MIDDLEWARE
// parser les json

app.use(express.json());

// logger de requête HTTP dans la console
app.use(morgan("dev"));

// permet les requêtes croos-origin ( qui viennet du front )
//CORS = CrossOrigin Ressource Sharing
// obligatoire sinon le nav bloque les requêtes

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost.5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

//ROUTE

// route de test pour verifier que l'api fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API fonctionnelle",
  });
});

// Routes de l'API
app.use("/api/article", articlesRoutes);
app.use("/api/client", clientRoutes);

// GESTIONS DES ERREURS
// Routes 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
  });
});

// Démmarage du serveur
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
