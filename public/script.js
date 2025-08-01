const calendar = document.getElementById("calendar");
const mesAtualEl = document.getElementById("mesAtual");
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

let hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
let agendamentos = {};
let statusDias = {};

function segundoDomingo(mes, ano) {
  let dia = 1, contador = 0;
  while (dia <= 14) {
    let data = new Date(ano, mes, dia);
    if (data.getDay() === 0) contador++;
    if (contador === 2) return dia;
    dia++;
  }
  return null;
}

function feriadosBloqueados(ano) {
  return [
    { dia: 24, mes: 11 },
    { dia: 25, mes: 11 },
    { dia: 31, mes: 11 },
    { dia: 12, mes: 9 },
    { dia: segundoDomingo(4, ano), mes: 4 },
    { dia: segundoDomingo(7, ano), mes: 7 }
  ].filter(f => f.dia !== null);
}

function carregarAgendamentosDoBanco(tentativas = 0) {
  Promise.all([
    fetch("https://terrazzo-6lae.onrender.com/agendamentos").then(res => res.json()),
    fetch("https://terrazzo-6lae.onrender.com/status-dia").then(res => res.json())
  ])
    .then(([agendamentosData, statusData]) => {
      agendamentos = {};
      statusDias = {};

      agendamentosData.forEach(item => {
        const [ano, mes, dia] = item.dia.split("-").map(n => parseInt(n, 10));
        const idDia = `${dia}-${mes - 1}-${ano}`;
        if (!agendamentos[idDia]) agendamentos[idDia] = [];
        agendamentos[idDia].push({
          nome: item.nome,
          horario: item.horario,
          diaTodo: item.dia_todo
        });
      });

      statusData.forEach(item => {
        const [ano, mes, dia] = item.dia.split("-").map(n => parseInt(n, 10));
        const idDia = `${dia}-${mes - 1}-${ano}`;
        statusDias[idDia] = item.status;
      });

      criarCalendario(mesAtual, anoAtual);
    })
    .catch(err => {
      console.error("Erro ao carregar dados:", err.message);
      calendar.innerHTML = `<p class="erro-calendario">🚫 Erro ao carregar dados. Tente atualizar a página.</p>`;
    });
}

function criarCalendario(mes, ano) {
  calendar.innerHTML = "";
  mesAtualEl.textContent = `${nomesMeses[mes]} ${ano}`;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const feriados = feriadosBloqueados(hoje.getFullYear() + 1);

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const idDia = `${dia}-${mes}-${ano}`;
    const dataDia = new Date(ano, mes, dia);
    const diaSemana = diasSemana[dataDia.getDay()];
    const divDia = document.createElement("div");
    divDia.className = "day";

    const isHoje =
      dia === hoje.getDate() &&
      mes === hoje.getMonth() &&
      ano === hoje.getFullYear();

    divDia.innerHTML = `
      <h3 class="${isHoje ? "hoje-vermelho" : ""}">${dia}</h3>
      <p class="dia-sem">${diaSemana}</p>
    `;

    const reservas = agendamentos[idDia] || [];
    const qtdReservas = reservas.length;
    const diaTodoMarcado = reservas.some(item => item.diaTodo);
    divDia.classList.remove("dia-verde", "dia-amarelo", "dia-vermelho");

    if (qtdReservas >= 3 || diaTodoMarcado) {
      divDia.classList.add("dia-vermelho");
    } else if (qtdReservas === 2) {
      divDia.classList.add("dia-amarelo");
    } else if (qtdReservas === 1) {
      divDia.classList.add("dia-verde");
    }

    const feriadosDoAno = feriadosBloqueados(ano);
    const bloqueado = feriadosDoAno.some(f => f.dia === dia && f.mes === mes) && hoje < new Date(ano, 0, 1);

    if (qtdReservas < 3 && !diaTodoMarcado && !bloqueado) {
      const btnAdd = document.createElement("button");
      btnAdd.className = "btn-plus";
      btnAdd.innerText = "+";
      btnAdd.onclick = () => abrirFormulario(idDia, dia, mes, ano);
      divDia.appendChild(btnAdd);
    }

    reservas.forEach(item => {
      const agendado = document.createElement("div");
      agendado.className = "agendado";
      agendado.textContent = `${item.nome} - ${item.horario}`;
      divDia.appendChild(agendado);
    });

    // 👇 Clique longo para abrir modal de senha
let pressTimer;

const iniciarPress = () => {
  pressTimer = setTimeout(() => {
    abrirModalSenha(dia, mes, ano);
  }, 5000);
};

const cancelarPress = () => clearTimeout(pressTimer);

divDia.addEventListener("mousedown", iniciarPress);
divDia.addEventListener("mouseup", cancelarPress);
divDia.addEventListener("mouseleave", cancelarPress);

// 👇 Suporte para celular
divDia.addEventListener("touchstart", iniciarPress);
divDia.addEventListener("touchend", cancelarPress);
divDia.addEventListener("touchcancel", cancelarPress);

    // 🔴 Aplicar status visual
    if (statusDias[idDia]) {
      divDia.classList.add("dia-vermelho-borda");
      const aviso = document.createElement("div");
      aviso.className = "status-dia";
      aviso.textContent = statusDias[idDia] === "manutencao"
        ? "🛠️ Em Manutenção"
        : "🚫 Bloqueado Temporariamente";
      divDia.appendChild(aviso);
    }

    calendar.appendChild(divDia);
  }
}

function abrirModalSenha(dia, mes, ano) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-content";
  modal.innerHTML = `
    <h3>🔐 Acesso restrito</h3>
    <input type="password" placeholder="Digite a senha" />
    <button>Entrar</button>
  `;

  modal.querySelector("button").onclick = () => {
    const senha = modal.querySelector("input").value;
    if (senha === "terrazzo125") {
      document.body.removeChild(overlay);
      abrirModalStatus(dia, mes, ano);
    } else {
      alert("❌ Senha incorreta.");
    }
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function abrirModalStatus(dia, mes, ano) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-content";
  modal.innerHTML = `
    <h3>⚠️ Selecionar status do espaço</h3>
    <select>
      <option value="">-- Escolha uma opção --</option>
      <option value="manutencao">Espaço em Manutenção</option>
      <option value="bloqueado">Espaço Bloqueado Temporariamente</option>
    </select>
    <button>Aplicar</button>
  `;

  modal.querySelector("button").onclick = () => {
    const status = modal.querySelector("select").value;
    if (!status) return alert("Selecione uma opção.");

    const idDia = `${dia}-${mes}-${ano}`;
    const diaFormatado = `${ano}-${mes + 1}-${dia}`;

    socket.emit("status-dia", { dia: diaFormatado, status });
    aplicarStatusDia(idDia, status);
    document.body.removeChild(overlay);
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function aplicarStatusDia(idDia, status) {
  const diaEl = [...document.querySelectorAll(".day")].find(el =>
    el.querySelector("h3")?.textContent == idDia.split("-")[0]
  );

  if (diaEl) {
    diaEl.classList.add("dia-vermelho-borda");

    // Remove status anterior se já existir
    const statusAntigo = diaEl.querySelector(".status-dia");
    if (statusAntigo) statusAntigo.remove();

    const aviso = document.createElement("div");
    aviso.className = "status-dia";
    aviso.textContent = status === "manutencao"
      ? "🛠️ Em Manutenção"
      : "🚫 Bloqueado Temporariamente";
    diaEl.appendChild(aviso);
  }
}

function abrirFormulario(idDia, dia, mes, ano) {
  const bloqueados = feriadosBloqueados(ano);
  const isFeriado = bloqueados.some(f => f.dia === dia && f.mes === mes);
  const dataLimite = new Date(ano, 0, 1);

  if (isFeriado && hoje < dataLimite) {
    alert("🚫 Esse feriado do ano seguinte só poderá ser reservado após o dia 1º de Janeiro para garantir justiça a todos.");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-content";

  modal.innerHTML = `
    <button class="fechar">X</button>
    <form class="form-inline">
      <input type="text" placeholder="Nome" required />
      <div class="hora-bloco">
        <label>Início:</label>
        <input type="time" class="hora-inicio" required />
        <label>Término:</label>
        <input type="time" class="hora-fim" required />
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="diaTodo" />
        <span class="texto-dia-todo">Reservar o dia todo</span>
      </div>
      <button type="submit">Agendar</button>
    </form>
  `;

  modal.querySelector(".fechar").onclick = () => document.body.removeChild(overlay);

  const form = modal.querySelector("form");
  const checkboxDiaTodo = modal.querySelector("#diaTodo");
  const inputInicio = modal.querySelector(".hora-inicio");
  const inputFim = modal.querySelector(".hora-fim");

  checkboxDiaTodo.onchange = () => {
    const desativado = checkboxDiaTodo.checked;
    inputInicio.disabled = desativado;
    inputFim.disabled = desativado;
    inputInicio.style.opacity = desativado ? "0.5" : "1";
    inputFim.style.opacity = desativado ? "0.5" : "1";
  };

  form.onsubmit = (e) => {
    e.preventDefault();

    const nome = form.querySelector("input[type='text']").value.trim();
    const inicio = inputInicio.value;
    const termino = inputFim.value;
    const diaTodo = checkboxDiaTodo.checked;

    if (!nome || (!diaTodo && (inicio >= termino))) {
      alert("Preencha todos os campos corretamente e verifique os horários.");
      return;
    }

    const horario = diaTodo ? "Dia inteiro" : `${inicio} - ${termino}`;
    const dataCompleta = new Date(ano, mes, dia).toISOString().split("T")[0];

    fetch("https://terrazzo-6lae.onrender.com/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, horario, dia: dataCompleta, dia_todo: diaTodo })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status} ao enviar agendamento`);
        return res.json();
      })
      .then(() => {
        document.body.removeChild(overlay);
        socket.emit("atualizar");
      })
      .catch(err => {
        alert("Erro ao agendar. Tente novamente.");
        console.error("⚠️ Falha no envio:", err.message);
      });
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

btnAnterior.onclick = () => {
  mesAtual = (mesAtual === 0) ? 11 : mesAtual - 1;
  anoAtual = (mesAtual === 11) ? anoAtual - 1 : anoAtual;
  carregarAgendamentosDoBanco();
};

btnProximo.onclick = () => {
  mesAtual = (mesAtual === 11) ? 0 : mesAtual + 1;
  anoAtual = (mesAtual === 0) ? anoAtual + 1 : anoAtual;
  carregarAgendamentosDoBanco();
};

// ⏳ Carregamento inicial
carregarAgendamentosDoBanco();

// 🔌 Conecta ao servidor WebSocket
const socket = io("https://terrazzo-6lae.onrender.com");

// 🔄 Escuta evento para atualizar em tempo real
socket.on("atualizar", () => {
  console.log("📡 Evento recebido: atualizar");
  carregarAgendamentosDoBanco();
});

// 🧾 CSS extra para borda vermelha e status
const estiloExtra = document.createElement("style");
estiloExtra.textContent = `
  .dia-vermelho-borda {
    border-left-color: #be1505ff;
  }
  .status-dia {
    margin-top: 5px;
    font-weight: bold;
    color: red;
    text-align: center;
  }
`;
document.head.appendChild(estiloExtra);