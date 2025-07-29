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

// 🔍 Calcula segundo domingo de um mês
function segundoDomingo(mes, ano) {
  let dia = 1;
  let contador = 0;
  while (dia <= 14) {
    const data = new Date(ano, mes, dia);
    if (data.getDay() === 0) contador++;
    if (contador === 2) return dia;
    dia++;
  }
  return null;
}

// 🔒 Retorna lista de feriados bloqueados do próximo ano
function feriadosBloqueados(proximoAno) {
  return [
    { dia: 24, mes: 11 }, // Natal véspera
    { dia: 25, mes: 11 }, // Natal
    { dia: 31, mes: 11 }, // Réveillon
    { dia: 12, mes: 9 },  // Dia das Crianças
    { dia: segundoDomingo(4, proximoAno), mes: 4 }, // Dia das Mães
    { dia: segundoDomingo(7, proximoAno), mes: 7 }, // Dia dos Pais
  ].filter(f => f.dia !== null);
}

function carregarAgendamentosDoBanco(tentativas = 0) {
  fetch("https://terrazzo.onrender.com/agendamentos")
    .then(res => {
      if (!res.ok) throw new Error(`Servidor respondeu com erro ${res.status}`);
      return res.json();
    })
    .then(dados => {
      if (!Array.isArray(dados)) {
        console.error("Resposta inválida do servidor:", dados);
        return;
      }

      agendamentos = {};
      dados.forEach(item => {
        const partes = item.dia.split("-");
        const [ano, mes, dia] = partes.map(p => parseInt(p, 10));
        const idDia = `${dia}-${mes - 1}-${ano}`;
        if (!agendamentos[idDia]) agendamentos[idDia] = [];
        agendamentos[idDia].push({
          nome: item.nome,
          horario: item.horario,
          diaTodo: item.dia_todo
        });
      });

      criarCalendario(mesAtual, anoAtual);
    })
    .catch(err => {
      console.error("⚠️ Erro ao carregar agendamentos:", err.message);
      if (tentativas < 3) {
        setTimeout(() => carregarAgendamentosDoBanco(tentativas + 1), 2000);
      } else {
        calendar.innerHTML = `<p class="erro-calendario">🚫 Erro ao carregar agendamentos. Tente atualizar a página.</p>`;
      }
    });
}

function criarCalendario(mes, ano) {
  calendar.innerHTML = "";
  mesAtualEl.textContent = `${nomesMeses[mes]} ${ano}`;

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataDia = new Date(ano, mes, dia);
    const diaSemana = diasSemana[dataDia.getDay()];
    const idDia = `${dia}-${mes}-${ano}`;

    const divDia = document.createElement("div");
    divDia.className = "day";

    const hoje = new Date();
    const isHoje =
      dia === hoje.getDate() &&
      mes === hoje.getMonth() &&
      ano === hoje.getFullYear();

    const classeHoje = isHoje ? "hoje-vermelho" : "";

    divDia.innerHTML = `
      <h3 class="${classeHoje}">${dia}</h3>
      <p class="dia-sem">${diaSemana}</p>
    `;

    let reservas = agendamentos[idDia] || [];
    let qtdReservas = reservas.length;
    let diaTodoMarcado = reservas.some(item => item.diaTodo);

    divDia.classList.remove("dia-verde", "dia-amarelo", "dia-vermelho");

    if (qtdReservas >= 3 || diaTodoMarcado) {
      divDia.classList.add("dia-vermelho");
    } else if (qtdReservas === 2) {
      divDia.classList.add("dia-amarelo");
    } else if (qtdReservas === 1) {
      divDia.classList.add("dia-verde");
    }

    if (qtdReservas < 3 && !diaTodoMarcado) {
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

    calendar.appendChild(divDia);
  }
}

function abrirFormulario(idDia, dia, mes, ano) {
  const hoje = new Date();
  const proximoAno = hoje.getFullYear() + 1;

  const feriados = feriadosBloqueados(proximoAno);
  const isFeriadoBloqueado = feriados.some(f => f.dia === dia && f.mes === mes && ano === proximoAno);

  if (isFeriadoBloqueado && hoje.getFullYear() < proximoAno) {
    alert("🚫 Este feriado especial só poderá ser reservado a partir de 1º de Janeiro do ano correspondente, para garantir justiça a todos.");
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

    fetch("https://terrazzo.onrender.com/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        horario,
        dia: dataCompleta,
        dia_todo: diaTodo
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status} ao enviar agendamento`);
        }
        return res.json();
      })
      .then(() => {
        document.body.removeChild(overlay);
        // Socket.IO atualiza todos
        socket.emit("atualizar"); // Notifica servidor após novo agendamento
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

// ⏳ Carrega ao abrir
carregarAgendamentosDoBanco();

// 🔌 Conecta ao servidor WebSocket
const socket = io("https://terrazzo.onrender.com");

// 🔄 Escuta evento e atualiza agendamentos em tempo real
socket.on("atualizar", () => {
  console.log("📡 Evento recebido: atualizar");
  carregarAgendamentosDoBanco();
});