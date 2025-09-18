const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve HTML, CSS, JS
app.use("/uploads", express.static(path.join(__dirname, "public/uploads"))); // Serve imagens

// Banco de dados
const pool = mysql.createPool({
  host: "sql10.freesqldatabase.com",
  user: "sql10792206",
  password: "hKT4bm2WIP",
  database: "sql10792206",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//////////////////////////
// 📅 AGENDAMENTOS
//////////////////////////

app.get("/agendamentos", (req, res) => {
  pool.query("SELECT * FROM agendamentos", (err, resultados) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(resultados);
  });
});

app.post("/agendamentos", (req, res) => {
  const { nome, horario, dia, dia_todo } = req.body;
  if (!nome || !horario || !dia) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes." });
  }

  const diaTodoFormatado = dia_todo ? 1 : 0;
  const query = `
    INSERT INTO agendamentos (nome, horario, dia, dia_todo)
    VALUES (?, ?, ?, ?)
  `;

  pool.query(query, [nome, horario, dia, diaTodoFormatado], (err, resultado) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ sucesso: true, id: resultado.insertId });
    io.emit("atualizar");
  });
});

app.delete("/agendamentos/:id", (req, res) => {
  const idAgendamento = req.params.id;
  pool.query("DELETE FROM agendamentos WHERE id = ?", [idAgendamento], (err, resultado) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado." });
    }
    res.json({ sucesso: true });
    io.emit("atualizar");
  });
});

app.get("/status-dia", (req, res) => {
  pool.query("SELECT dia, status FROM status_dias", (err, resultados) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(resultados);
  });
});

//////////////////////////
// 🛍️ COMÉRCIOS DOS MORADORES
//////////////////////////

// Configuração do multer
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + file.fieldname + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

// POST: cadastrar comércio
app.post("/comercios", upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "fotos[]", maxCount: 10 }
]), (req, res) => {
  const {
    bloco,
    apartamento,
    nomeMorador,
    telefone,
    nomeNegocio,
    tipoNegocio,
    descricao
  } = req.body;

  const logoUrl = req.files["logo"]
    ? `/uploads/${req.files["logo"][0].filename}`
    : null;

  const fotos = req.files["fotos[]"]
    ? req.files["fotos[]"].map(file => `/uploads/${file.filename}`)
    : [];

  const query = `
    INSERT INTO comercios (
      bloco, apartamento, nomeMorador, telefone,
      nomeNegocio, tipoNegocio, descricao, logoUrl, fotos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(query, [
    bloco,
    apartamento,
    nomeMorador,
    telefone,
    nomeNegocio,
    tipoNegocio,
    descricao,
    logoUrl,
    JSON.stringify(fotos)
  ], (err, resultado) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ sucesso: true, id: resultado.insertId });
  });
});

// GET: listar comércios
app.get("/comercios", (req, res) => {
  pool.query("SELECT * FROM comercios", (err, resultados) => {
    if (err) return res.status(500).json({ erro: err.message });

    const comercios = resultados.map(c => ({
      ...c,
      fotos: c.fotos ? JSON.parse(c.fotos) : []
    }));

    res.json(comercios);
  });
});

//////////////////////////
// 📡 WEBSOCKET
//////////////////////////

io.on("connection", (socket) => {
  console.log("📡 Cliente conectado");

socket.on("status-dia", ({ dia, status }) => {
  if (!dia || !status) return;

  if (status === "livre") {
    // Remove o status do dia
    pool.query("DELETE FROM status_dias WHERE dia = ?", [dia], (err) => {
      if (err) return console.error("Erro ao remover status:", err.message);
      io.emit("atualizar");
    });
  } else {
    // Atualiza ou insere novo status
    const query = `
      INSERT INTO status_dias (dia, status)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;
    pool.query(query, [dia, status], (err) => {
      if (err) return console.error("Erro ao salvar status:", err.message);
      io.emit("atualizar");
    });
  }
});
});

//////////////////////////
// 🚀 INICIAR SERVIDOR
//////////////////////////

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});