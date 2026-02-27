const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

require("dotenv").config();

const db = require("./db");

// === importation des routes ===
const articlesRoutes = require("./article/routes/ArticleRouter");
const clientRoutes = require("./client/routes/ClientRouter");
const orderRoutes = require("./order/routes/OrderRouter");
const factureRoutes = require("./facture/routes/factureRouter");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Crucial pour AuthContext et les sessions
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API fonctionnelle" });
});

// === Utilisation des routes ===
app.use("/api/articles", articlesRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/commandes", orderRoutes);
app.use("/api/facture", factureRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
