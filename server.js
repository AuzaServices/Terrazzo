const express = require("express");
const mysql = require("mysql2/promise"); // ✅ versão promise
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

// 🌩️ Cloudinary config
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

// Banco de dados
const pool = mysql.createPool({
  host: "sql10.freesqldatabase.com",
  user: "sql10797",
  password: "NZdlWef",
  database: "sql10799",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 5, // ✅ reduzido para não estourar limite
  queueLimit: 0
});

// 🧹 Limpeza anual automática
async function limpezaAnual() {
  const hoje = new Date();
  const ehPrimeiroDeJaneiro = hoje.getDate() === 1 && hoje.getMonth() === 0;
  if (!ehPrimeiroDeJaneiro) return;

  const anoAnterior = hoje.getFullYear() - 1;
  const anoAtual = hoje.getFullYear();

  await pool.query("DELETE FROM agendamentos WHERE YEAR(dia) = ?", [anoAnterior]);
  await pool.query("DELETE FROM status_dias WHERE YEAR(dia) = ?", [anoAnterior]);

  const values = [];
  for (let mes = 0; mes < 12; mes++) {
    const diasNoMes = new Date(anoAtual, mes + 1, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(anoAtual, mes, dia);
      const diaSemana = data.getDay();
      if (diaSemana === 3 || diaSemana === 4) {
        values.push([`${anoAtual}-${mes + 1}-${dia}`, "limpeza"]);
      }
    }
  }
  if (values.length > 0) {
    await pool.query("INSERT IGNORE INTO status_dias (dia, status) VALUES ?", [values]);
  }
}

// 🧹 Limpeza de meses anteriores ao atual
async function limpezaMensal() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  await pool.query(
    `DELETE FROM agendamentos WHERE (YEAR(dia) < ?) OR (YEAR(dia) = ? AND MONTH(dia) < ?)`,
    [anoAtual, anoAtual, mesAtual]
  );
  await pool.query(
    `DELETE FROM status_dias WHERE (YEAR(dia) < ?) OR (YEAR(dia) = ? AND MONTH(dia) < ?)`,
    [anoAtual, anoAtual, mesAtual]
  );
}

// ✅ Preenche quartas e quintas até dezembro de 2026
async function preencherLimpezaAte2026() {
  const hoje = new Date();
  const anoFinal = 2026;
  const values = [];

  for (let ano = hoje.getFullYear(); ano <= anoFinal; ano++) {
    for (let mes = 0; mes < 12; mes++) {
      const diasNoMes = new Date(ano, mes + 1, 0).getDate();
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(ano, mes, dia);
        const diaSemana = data.getDay();
        if (diaSemana === 3 || diaSemana === 4) {
          values.push([`${ano}-${mes + 1}-${dia}`, "limpeza"]);
        }
      }
    }
  }
  if (values.length > 0) {
    await pool.query("INSERT IGNORE INTO status_dias (dia, status) VALUES ?", [values]);
  }
}

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📅 AGENDAMENTOS
app.get("/agendamentos", async (req, res) => {
  try {
    const [resultados] = await pool.query("SELECT * FROM agendamentos");
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/agendamentos", async (req, res) => {
  const { nome, horario, dia, dia_todo } = req.body;
  if (!nome || !horario || !dia) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes." });
  }

  const hoje = new Date();
  const dataAgendada = new Date(dia);
  if (
    dataAgendada.getFullYear() < hoje.getFullYear() ||
    (dataAgendada.getFullYear() === hoje.getFullYear() && dataAgendada.getMonth() < hoje.getMonth())
  ) {
    return res.status(403).json({ erro: "Não é permitido agendar meses anteriores ao atual." });
  }

  const diaTodoFormatado = dia_todo ? 1 : 0;
  try {
    const [resultado] = await pool.query(
      `INSERT INTO agendamentos (nome, horario, dia, dia_todo) VALUES (?, ?, ?, ?)`,
      [nome, horario, dia, diaTodoFormatado]
    );
    res.json({ sucesso: true, id: resultado.insertId });
    io.emit("atualizar");
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.delete("/agendamentos/:id", async (req, res) => {
  const idAgendamento = req.params.id;
  try {
    const [resultado] = await pool.query("DELETE FROM agendamentos WHERE id = ?", [idAgendamento]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado." });
    }
    res.json({ sucesso: true });
    io.emit("atualizar");
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get("/status-dia", async (req, res) => {
  try {
    const [resultados] = await pool.query("SELECT dia, status FROM status_dias");
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 📡 WEBSOCKET
io.on("connection", (socket) => {
  socket.on("status-dia", async ({ dia, status }) => {
    if (!dia) return;

    try {
      if (status === "livre") {
        await pool.query("DELETE FROM status_dias WHERE dia = ?", [dia]);
        await pool.query("DELETE FROM agendamentos WHERE dia = ?", [dia]);
        io.emit("atualizar");
      } else if (["manutencao", "bloqueado", "limpeza"].includes(status)) {
        await pool.query(
          `INSERT INTO status_dias (dia, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)`,
          [dia, status]
        );
        io.emit("atualizar");
      }
    } catch (err) {
      console.error("Erro no socket:", err.message);
    }
  });
});

// 🚀 INICIAR SERVIDOR
(async () => {
  await limpezaAnual();
  await limpezaMensal();
  await preencherLimpezaAte2026();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
})();