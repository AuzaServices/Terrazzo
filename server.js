const express = require("express");
const mysql = require("mysql2");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para ler JSON do corpo das requisições
app.use(express.json());

// Conexão com MySQL
const conexao = mysql.createConnection({
  host: "sql10.freesqldatabase.com",
  user: "sql10792206",
  password: "hKT4bm2WIP",
  database: "sql10792206",
  port: 3306 // ou use o valor exato do FreeSQLDatabase
});

// Testar conexão
conexao.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectado ao MySQL com sucesso!");
  }
});

// Rota para salvar reserva
app.post("/reservas", (req, res) => {
  const { nome, data } = req.body;
  const query = "INSERT INTO reservas (nome, data) VALUES (?, ?)";
  conexao.query(query, [nome, data], (err, resultado) => {
    if (err) {
      return res.status(500).json({ erro: err });
    }
    res.json({ sucesso: true, id: resultado.insertId });
  });
});

// Rota para listar reservas
app.get("/reservas", (req, res) => {
  conexao.query("SELECT * FROM reservas", (err, resultados) => {
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