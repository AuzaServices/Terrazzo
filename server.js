const express = require("express");
const mysql = require("mysql2");
const cors = require("cors"); // Permitir requisições de outras origens
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const conexao = mysql.createConnection({
  host: "sql10.freesqldatabase.com",
  user: "sql10792206",
  password: "hKT4bm2WIP",
  database: "sql10792206",
  port: 3306
});

conexao.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectado ao MySQL com sucesso!");
  }
});

// Rota para salvar agendamento
app.post("/agendamentos", (req, res) => {
  const { nome, horario, dia, dia_todo } = req.body;
  const query = `
    INSERT INTO agendamentos (nome, horario, dia, dia_todo)
    VALUES (?, ?, ?, ?)
  `;
  conexao.query(query, [nome, horario, dia, dia_todo], (err, resultado) => {
    if (err) {
      return res.status(500).json({ erro: err });
    }
    res.json({ sucesso: true, id: resultado.insertId });
  });
});

// Rota para listar agendamentos
app.get("/agendamentos", (req, res) => {
  conexao.query("SELECT * FROM agendamentos", (err, resultados) => {
    if (err) {
      return res.status(500).json({ erro: err });
    }
    res.json(resultados);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});