// server.js

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve os arquivos do front-end

// Pool de conexões com MySQL
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

// Rota principal - carrega a página do calendário
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota para cadastrar agendamentos
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
  });
});

// Rota para listar todos os agendamentos
app.get("/agendamentos", (req, res) => {
  pool.query("SELECT * FROM agendamentos", (err, resultados) => {
    if (err) {
      console.error("🚨 ERRO NA QUERY:", err.message);
      return res.status(500).json({ erro: err.message });
    }
    res.json(resultados);
  });
});

// Inicializa o servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});