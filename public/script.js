const calendar = document.getElementById("calendar");
const mesAtualEl = document.getElementById("mesAtual");
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

let hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

let agendamentos = {};

function carregarAgendamentosDoBanco() {
  fetch("https://terrazzo.onrender.com/agendamentos")
    .then(res => res.json())
    .then(dados => {
      agendamentos = {};
      dados.forEach(item => {
        // 🔧 Usa a data string pura para evitar erro de fuso
        const [ano, mes, dia] = item.dia.split("-").map(Number);
        const idDia = `${dia}-${mes - 1}-${ano}`;

        if (!agendamentos[idDia]) agendamentos[idDia] = [];
        agendamentos[idDia].push({
          nome: item.nome,
          horario: item.horario,
          diaTodo: item.dia_todo
        });
      });

      criarCalendario(mesAtual, anoAtual);
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
    divDia.innerHTML = `<h3>${dia}</h3><p class="dia-sem">${diaSemana}</p>`;

    let reservas = agendamentos[idDia] || [];
    let qtdReservas = reservas.length;
    let diaTodoMarcado = reservas.some(item => item.diaTodo);

    if (qtdReservas >= 3 || diaTodoMarcado) {
      divDia.classList.add("dia-cheio");
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

    // 🔧 Construir data string estável
    const dataCompleta = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    fetch("https://terrazzo.onrender.com/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        horario,
        dia: dataCompleta,
        dia_todo: diaTodo
      })
    }).then(() => {
      document.body.removeChild(overlay);
      carregarAgendamentosDoBanco();
    });
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

btnAnterior.onclick = () => {
  mesAtual = (mesAtual === 0) ? 11 : mesAtual - 1;
  anoAtual = (mesAtual === 11) ? anoAtual - 1 : anoAtual;
  criarCalendario(mesAtual, anoAtual);
};

btnProximo.onclick = () => {
  mesAtual = (mesAtual === 11) ? 0 : mesAtual + 1;
  anoAtual = (mesAtual === 0) ? anoAtual + 1 : anoAtual;
  criarCalendario(mesAtual, anoAtual);
};

// 🔁 Atualização automática
carregarAgendamentosDoBanco();
setInterval(carregarAgendamentosDoBanco, 1000);