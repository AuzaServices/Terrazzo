const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/agendamentos", (req, res) => {
  pool.query("SELECT * FROM agendamentos", (err, resultados) => {
    if (err) {
      console.error("🚨 ERRO NA QUERY:", err.message);
      return res.status(500).json({ erro: err.message });
    }
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
    if (err) {
      console.error("❌ Erro ao salvar agendamento:", err.message);
      return res.status(500).json({ erro: err.message });
    }

    res.json({ sucesso: true, id: resultado.insertId });

    // 🔄 Emitir evento para todos os clientes conectados
    io.emit("atualizar");
  });
});

app.delete("/agendamentos/:id", (req, res) => {
  const idAgendamento = req.params.id;
  const query = "DELETE FROM agendamentos WHERE id = ?";

  pool.query(query, [idAgendamento], (err, resultado) => {
    if (err) {
      console.error("❌ Erro ao excluir agendamento:", err.message);
      return res.status(500).json({ erro: err.message });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado." });
    }

    res.json({ sucesso: true, mensagem: "Agendamento removido com sucesso." });

    // 🔄 Emitir evento para atualizar clientes
    io.emit("atualizar");
  });
});

io.on("connection", (socket) => {
  console.log("📡 Novo cliente conectado");

  socket.on("disconnect", () => {
    console.log("👋 Cliente desconectado");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor com WebSocket rodando em http://localhost:${PORT}`);
});