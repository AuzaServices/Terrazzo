const express = require("express");
const mysql = require("mysql2");
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
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "webp"]
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Banco de dados
const pool = mysql.createPool({
  host: "sql10.freesqldatabase.com",
  user: "sql10799187",
  password: "NZdlWeIzBf",
  database: "sql10799187",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🧹 Limpeza anual automática
function limpezaAnual() {
  const hoje = new Date();
  const ehPrimeiroDeJaneiro = hoje.getDate() === 1 && hoje.getMonth() === 0;
  if (!ehPrimeiroDeJaneiro) return;

  const anoAnterior = hoje.getFullYear() - 1;
  const anoAtual = hoje.getFullYear();

  pool.query("DELETE FROM agendamentos WHERE YEAR(dia) = ?", [anoAnterior], (err) => {
    if (err) console.error("❌ Erro ao apagar agendamentos:", err.message);
    else console.log(`🧹 Agendamentos de ${anoAnterior} removidos`);
  });

  pool.query("DELETE FROM status_dias WHERE YEAR(dia) = ?", [anoAnterior], (err) => {
    if (err) console.error("❌ Erro ao apagar status:", err.message);
    else console.log(`🧹 Status de ${anoAnterior} removidos`);
  });

  for (let mes = 0; mes < 12; mes++) {
    const diasNoMes = new Date(anoAtual, mes + 1, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(anoAtual, mes, dia);
      const diaSemana = data.getDay();
      if (diaSemana === 3 || diaSemana === 4) {
        const diaFormatado = `${anoAtual}-${mes + 1}-${dia}`;
        pool.query(
          `INSERT IGNORE INTO status_dias (dia, status) VALUES (?, ?)`,
          [diaFormatado, "limpeza"],
          (err) => {
            if (err) console.error("❌ Erro ao registrar limpeza:", err.message);
          }
        );
      }
    }
  }

  console.log(`✅ Limpeza anual executada para ${anoAnterior} e preenchido ${anoAtual}`);
}

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📅 AGENDAMENTOS
app.get("/agendamentos", (req, res) => {
  pool.query("SELECT * FROM agendamentos", (err, resultados) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(resultados);
  });
});

app.post("/agendamentos", (req, res) => {
  console.log("📥 Dados recebidos:", req.body);
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
      console.error("❌ Erro ao inserir agendamento:", err.message);
      return res.status(500).json({ erro: err.message });
    }
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

// 🛍️ COMÉRCIOS
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
    ? req.files["logo"][0].path
    : null;

  const fotos = req.files["fotos[]"]
    ? req.files["fotos[]"].map(file => file.path)
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

// 📡 WEBSOCKET
io.on("connection", (socket) => {
  console.log("📡 Cliente conectado");

  socket.on("status-dia", ({ dia, status }) => {
    if (!dia) return;

    if (status === "livre") {
      pool.query("DELETE FROM status_dias WHERE dia = ?", [dia], (err) => {
        if (err) return console.error("❌ Erro ao remover status:", err.message);
        console.log(`✅ Status removido do dia ${dia}`);

        pool.query("DELETE FROM agendamentos WHERE dia = ?", [dia], (err) => {
          if (err) return console.error("❌ Erro ao remover agendamentos:", err.message);
          console.log(`🧹 Agendamentos removidos do dia ${dia}`);
          io.emit("atualizar");
        });
      });
    } else if (["manutencao", "bloqueado", "limpeza"].includes(status)) {
      const query = `
        INSERT INTO status_dias (dia, status)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;
      pool.query(query, [dia, status], (err) => {
        if (err) return console.error("❌ Erro ao salvar status:", err.message);
        console.log(`⚙️ Status "${status}" aplicado ao dia ${dia}`);
        io.emit("atualizar");
      });
    } else {
      console.warn(`⚠️ Status inválido recebido: "${status}"`);
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 Cliente desconectado");
  });
});

// 🚀 INICIAR SERVIDOR
limpezaAnual();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});