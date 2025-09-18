const calendar = document.getElementById("calendar"),
    mesAtualEl = document.getElementById("mesAtual"),
    btnAnterior = document.getElementById("btnAnterior"),
    btnProximo = document.getElementById("btnProximo"),
    nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
let hoje = new Date,
    mesAtual = hoje.getMonth(),
    anoAtual = hoje.getFullYear(),
    agendamentos = {},
    statusDias = {};

function segundoDomingo(e, o) {
    let t = 1,
        a = 0;
    for (; t <= 14;) {
        if (0 === new Date(o, e, t).getDay() && a++, 2 === a) return t;
        t++
    }
    return null
}

function feriadosBloqueados(e) {
    return [{
        dia: 24,
        mes: 11
    }, {
        dia: 25,
        mes: 11
    }, {
        dia: 31,
        mes: 11
    }, {
        dia: 12,
        mes: 9
    }, {
        dia: segundoDomingo(4, e),
        mes: 4
    }, {
        dia: segundoDomingo(7, e),
        mes: 7
    }].filter((e => null !== e.dia))
}

function carregarAgendamentosDoBanco(e = 0) {
    Promise.all([fetch("https://terrazzo-6lae.onrender.com/agendamentos").then((e => e.json())), fetch("https://terrazzo-6lae.onrender.com/status-dia").then((e => e.json()))]).then((([e, o]) => {
        agendamentos = {}, statusDias = {}, e.forEach((e => {
            const [o, t, a] = e.dia.split("-").map((e => parseInt(e, 10))), n = `${a}-${t-1}-${o}`;
            agendamentos[n] || (agendamentos[n] = []), agendamentos[n].push({
                nome: e.nome,
                horario: e.horario,
                diaTodo: e.dia_todo
            })
        })), o.forEach((e => {
            const [o, t, a] = e.dia.split("-").map((e => parseInt(e, 10)));
            statusDias[`${a}-${t-1}-${o}`] = e.status
        })), criarCalendario(mesAtual, anoAtual)
    })).catch((e => {
        console.error("Erro ao carregar dados:", e.message), calendar.innerHTML = '<p class="erro-calendario">🚫 Erro ao carregar dados. Tente atualizar a página.</p>'
    }))
}
const limpezaRegistrada = {};
function criarCalendario(mes, ano) {
    calendar.innerHTML = "";
    mesAtualEl.textContent = `${nomesMeses[mes]} ${ano}`;
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    feriadosBloqueados(hoje.getFullYear() + 1);

    for (let dia = 1; dia <= totalDias; dia++) {
        const chave = `${dia}-${mes}-${ano}`;
        const data = new Date(ano, mes, dia);
        const diaSemana = diasSemana[data.getDay()];
        const elementoDia = document.createElement("div");
        elementoDia.className = "day";

        const ehHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
        elementoDia.innerHTML = `
            <h3 class="${ehHoje ? "hoje-vermelho" : ""}">${dia}</h3>
            <p class="dia-sem">${diaSemana}</p>
        `;

        const agendados = agendamentos[chave] || [];
        const totalAgendados = agendados.length;
        const temDiaTodo = agendados.some((a) => a.diaTodo);

        elementoDia.classList.remove("dia-verde", "dia-amarelo", "dia-vermelho");
        if (totalAgendados >= 3 || temDiaTodo) {
            elementoDia.classList.add("dia-vermelho");
        } else if (totalAgendados === 2) {
            elementoDia.classList.add("dia-amarelo");
        } else if (totalAgendados === 1) {
            elementoDia.classList.add("dia-verde");
        }

        const ehFeriado = feriadosBloqueados(ano).some((f) => f.dia === dia && f.mes === mes) && hoje < new Date(ano, 0, 1);
        const status = statusDias[chave];
        const ehBloqueado = status === "manutencao" || status === "bloqueado";
        const ehDiaLimpeza = (data.getDay() === 3 || data.getDay() === 4) && status !== "livre";

        // ✅ Salva "limpeza" no banco se for quarta ou quinta e ainda não tiver status
if ((data.getDay() === 3 || data.getDay() === 4) && !statusDias[chave] && status !== "livre") {
    const diaFormatado = `${ano}-${mes + 1}-${dia}`;
    limpezaRegistrada[chave] = true; // evita duplicação
    socket.emit("status-dia", {
        dia: diaFormatado,
        status: "limpeza"
    });
}

        // ✅ Exibe visual de limpeza se for quarta ou quinta e não estiver liberado
        if (ehDiaLimpeza) {
            elementoDia.classList.add("dia-limpeza");
            const statusEl = document.createElement("div");
            statusEl.className = "status-limpeza";
            statusEl.textContent = "Dia de Limpeza";
            elementoDia.appendChild(statusEl);
        }

        // ✅ Exibe botão "+" se o dia estiver liberado
        if (totalAgendados < 3 && !temDiaTodo && !ehFeriado && !ehBloqueado && !ehDiaLimpeza) {
            const botao = document.createElement("button");
            botao.className = "btn-plus";
            botao.innerText = "+";
            botao.onclick = () => abrirFormulario(chave, dia, mes, ano);
            elementoDia.appendChild(botao);
        }

        agendados.forEach((a) => {
            const agendamentoEl = document.createElement("div");
            agendamentoEl.className = "agendado";
            agendamentoEl.textContent = `${a.nome} - ${a.horario}`;
            elementoDia.appendChild(agendamentoEl);
        });

        let timeout;
        const iniciarPressao = () => {
            timeout = setTimeout(() => abrirModalSenha(dia, mes, ano), 5000);
        };
        const cancelarPressao = () => clearTimeout(timeout);

        elementoDia.addEventListener("mousedown", iniciarPressao);
        elementoDia.addEventListener("mouseup", cancelarPressao);
        elementoDia.addEventListener("mouseleave", cancelarPressao);
        elementoDia.addEventListener("touchstart", iniciarPressao);
        elementoDia.addEventListener("touchend", cancelarPressao);
        elementoDia.addEventListener("touchcancel", cancelarPressao);

        // ✅ Exibe status visual se não for "livre"
        if (status && status !== "livre") {
            elementoDia.classList.add("dia-vermelho-borda");
            const statusEl = document.createElement("div");
            statusEl.className = "status-dia";
            statusEl.textContent =
                status === "manutencao" ? "Em Manutenção" :
                status === "bloqueado" ? "Indisponível Hoje" :
                status === "limpeza" ? "Dia de Limpeza" : "";
            elementoDia.appendChild(statusEl);
        }

        calendar.appendChild(elementoDia);
    }
}

function abrirModalSenha(e, o, t) {
    const a = document.createElement("div");
    a.className = "modal-overlay";
    const n = document.createElement("div");
    n.className = "modal-content", n.innerHTML = '\n <h3>Acesso restrito</h3>\n <input type="password" placeholder="Digite a senha" />\n <button>Entrar</button>\n ', n.querySelector("button").onclick = () => {
        "terrazzo125" === n.querySelector("input").value ? (document.body.removeChild(a), abrirModalStatus(e, o, t)) : alert("Senha incorreta.")
    }, a.appendChild(n), document.body.appendChild(a)
}

function abrirModalStatus(e, o, t) {
    const a = document.createElement("div");
    a.className = "modal-overlay";

    const n = document.createElement("div");
    n.className = "modal-content";
    n.innerHTML = `
        <h3>Selecionar status do espaço</h3>
        <select>
            <option value="">-- Escolha uma opção --</option>
            <option value="manutencao">Espaço em Manutenção</option>
            <option value="bloqueado">Indisponível Hoje</option>
            <option value="livre">Liberar para uso</option> <!-- NOVA OPÇÃO -->
        </select>
        <button>Aplicar</button>
    `;

    n.querySelector("button").onclick = () => {
        const r = n.querySelector("select").value;
        if (!r) return alert("Selecione uma opção.");

        const s = `${e}-${o}-${t}`;
        const i = `${t}-${o + 1}-${e}`;

        // Envia o novo status via socket
        socket.emit("status-dia", {
            dia: i,
            status: r
        });

        // Aplica visualmente o status
        aplicarStatusDia(s, r);

        // Remove o modal
        document.body.removeChild(a);
    };

    a.appendChild(n);
    document.body.appendChild(a);
}

function aplicarStatusDia(e, o) {
    const t = [...document.querySelectorAll(".day")].find((oEl =>
        oEl.querySelector("h3")?.textContent == e.split("-")[0]
    ));
    if (t) {
        t.classList.remove("dia-vermelho-borda");
        const statusEl = t.querySelector(".status-dia");
        if (statusEl) statusEl.remove();

        if (o !== "livre") {
            t.classList.add("dia-vermelho-borda");
            const novoStatus = document.createElement("div");
            novoStatus.className = "status-dia";
            novoStatus.textContent = o === "manutencao" ? "Em Manutenção" : "Indisponível Hoje";
            t.appendChild(novoStatus);
        }
    }
}

function abrirFormulario(e, o, t, a) {
    const n = feriadosBloqueados(a).some((e => e.dia === o && e.mes === t)),
        r = new Date(a, 0, 1);
    if (n && hoje < r) return void alert("🚫 Esse feriado do ano seguinte só poderá ser reservado após o dia 1º de Janeiro para garantir justiça a todos.");
    const s = document.createElement("div");
    s.className = "modal-overlay";
    const i = document.createElement("div");
    i.className = "modal-content", i.innerHTML = '\n    <button class="fechar">X</button>\n    <form class="form-inline">\n      <input type="text" placeholder="Nome" required />\n      <div class="hora-bloco">\n        <label>Início:</label>\n        <input type="time" class="hora-inicio" required />\n        <label>Término:</label>\n        <input type="time" class="hora-fim" required />\n      </div>\n      <div class="checkbox-wrapper">\n        <input type="checkbox" id="diaTodo" />\n        <span class="texto-dia-todo">Reservar o dia todo</span>\n      </div>\n      <button type="submit">Agendar</button>\n    </form>\n  ', i.querySelector(".fechar").onclick = () => document.body.removeChild(s);
    const d = i.querySelector("form"),
        c = i.querySelector("#diaTodo"),
        l = i.querySelector(".hora-inicio"),
        m = i.querySelector(".hora-fim");
    c.onchange = () => {
        const e = c.checked;
        l.disabled = e, m.disabled = e, l.style.opacity = e ? "0.5" : "1", m.style.opacity = e ? "0.5" : "1"
    }, d.onsubmit = e => {
        e.preventDefault();
        const n = d.querySelector("input[type='text']").value.trim(),
            r = l.value,
            i = m.value,
            u = c.checked;
        if (!n || !u && r >= i) return void alert("Preencha todos os campos corretamente e verifique os horários.");
        const p = u ? "Dia inteiro" : `${r} - ${i}`,
            h = new Date(a, t, o).toISOString().split("T")[0];
        fetch("https://terrazzo-6lae.onrender.com/agendamentos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: n,
                horario: p,
                dia: h,
                dia_todo: u
            })
        }).then((e => {
            if (!e.ok) throw new Error(`Erro ${e.status} ao enviar agendamento`);
            return e.json()
        })).then((() => {
            document.body.removeChild(s), socket.emit("atualizar")
        })).catch((e => {
            alert("Erro ao agendar. Tente novamente."), console.error("⚠️ Falha no envio:", e.message)
        }))
    }, s.appendChild(i), document.body.appendChild(s)
}
btnAnterior.onclick = () => {
    mesAtual = 0 === mesAtual ? 11 : mesAtual - 1, anoAtual = 11 === mesAtual ? anoAtual - 1 : anoAtual, carregarAgendamentosDoBanco()
}, btnProximo.onclick = () => {
    mesAtual = 11 === mesAtual ? 0 : mesAtual + 1, anoAtual = 0 === mesAtual ? anoAtual + 1 : anoAtual, carregarAgendamentosDoBanco()
}, carregarAgendamentosDoBanco();
const socket = io("https://terrazzo-6lae.onrender.com");
socket.on("atualizar", (() => {
    console.log("📡 Evento recebido: atualizar"), carregarAgendamentosDoBanco()
}));
const estiloExtra = document.createElement("style");
estiloExtra.textContent = "\n .dia-vermelho-borda {\n border-left-color: #818181ff;\n }\n .status-dia {\n margin-top: 5px;\n font-weight: bold;\n color: #818181ff;\n text-align: left;\n }\n", document.head.appendChild(estiloExtra), setInterval((() => {
    console.log("🔄 Atualizando calendário automaticamente..."), carregarAgendamentosDoBanco()
}), 2e3), document.addEventListener("DOMContentLoaded", (() => {
    const e = document.getElementById("btnMostrarFormulario"),
        o = document.getElementById("formComercio"),
        t = document.querySelector(".comercios-container");
    async function a() {
        try {
            const e = await fetch("/comercios"),
                o = await e.json();
            t.innerHTML = "", o.forEach((e => {
                const o = document.createElement("div");
                o.className = "comercio-card", o.innerHTML = `\n ${e.logoUrl?`<img class="logo-comercio" src="${e.logoUrl}" alt="Logo do comércio">`:""}\n <h4>${e.nomeNegocio}</h4>\n <p><strong>Tipo:</strong> ${e.tipoNegocio}</p>\n <p><strong>Descrição:</strong> ${e.descricao}</p>\n <p><strong>Morador:</strong> ${e.nomeMorador}</p>\n <p><strong>Local:</strong> Bloco ${e.bloco}, Ap ${e.apartamento}</p>\n <a class="btn-whatsapp" href="https://wa.me/55${e.telefone.replace(/\D/g,"")}" target="_blank">\n Chamar no Whats\n </a>\n ${e.fotos?.length?`\n <div class="fotos-mercadorias">\n ${e.fotos.map((e=>`<img src="${e}" alt="Mercadoria">`)).join("")}\n </div>\n `:""}\n `, t.appendChild(o)
            }))
        } catch (e) {
            console.error("Erro ao carregar negócios:", e)
        }
    }
    e?.addEventListener("click", (() => {
        const e = "block" === o.style.display;
        o.style.display = e ? "none" : "block"
    })), o?.addEventListener("submit", (async e => {
        e.preventDefault();
        const t = new FormData(o);
        try {
            if (!(await fetch("/comercios", {
                    method: "POST",
                    body: t
                })).ok) throw new Error("Erro ao enviar dados");
            o.reset(), o.style.display = "none", a()
        } catch (e) {
            alert("Falha ao cadastrar negócio. Tente novamente."), console.error(e)
        }
    })), a()
}));