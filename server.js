import express from "express";
import 'dotenv/config';

const app = express();

// Para leer JSON que envíe el frontend
app.use(express.json());

// Ruta de prueba (Railway la usa para saber que tu API está viva)
app.get("/", (req, res) => {
  res.send("GamesHub Backend is running 🚀");
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Backend escuchando en puerto ${PORT}`);
});
