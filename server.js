const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

// 🌩️ Cloudinary config (opcional, se quiser manter upload)
cloudinary.config({
  cloud_name: "dzwkr47ib",
  api_key: "553561859359519",
  api_secret: "**********"
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "uploads",
    resource_type: "image"
  })
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Exemplo de rota de upload (sem banco, apenas retorna URL do Cloudinary)
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ url: req.file.path });
});

// 📡 WEBSOCKET (apenas exemplo de comunicação)
io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  socket.on("mensagem", (msg) => {
    console.log("Mensagem recebida:", msg);
    io.emit("mensagem", msg); // retransmite para todos
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// 🚀 INICIAR SERVIDOR
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});