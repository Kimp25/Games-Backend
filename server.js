import express from "express";
import cors from "cors";
import { db } from "./firebase.js";

const app = express();
app.use(cors());

// LISTA DE JUEGOS
app.get("/games", async (req, res) => {
  try {
    const snapshot = await db.collection("games").get();
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo juegos" });
  }
});

// TEST
app.get("/", (req, res) => {
  res.send("Backend funcionando ✔");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor en puerto", port));
