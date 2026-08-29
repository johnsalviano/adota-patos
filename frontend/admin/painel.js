const SUPABASE_URL = "https://fnlqruzbgwffhrqmpfvi.supabase.co";
const SUPABASE_KEY = "sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR";

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function escaparTexto(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.textContent;
}

function mostrarFeedback(el, texto, erro) {
    el.textContent = texto;
    el.className = "feedback" + (erro ? " erro" : " sucesso");
}

function formatarData(iso) {
    try {
        return new Date(iso).toLocaleDateString("pt-BR");
    } catch (e) {
        return "";
    }
}

// =========================
// GUARDA DE ACESSO
// =========================

async function verificarAcesso() {
    const { data: { session } } = await cliente.auth.getSession();
    if (!session) { window.location.href = "login.html"; return null; }

    const { data: membro } = await cliente.rpc("eh_membro_ong");
    if (!membro) { await cliente.auth.signOut(); window.location.href = "login.html"; return null; }

    const email = session.user.email || "";
    document.getElementById("email-logado").textContent = email;
    document.getElementById("email-logado-inicial").textContent = email;
    document.getElementById("tela-carregando").classList.add("oculto");
    document.getElementById("conteudo-painel").classList.remove("oculto");
    return session;
}

// =========================
// NAVEGACAO ENTRE TELAS
// =========================

function mostrarTela(id) {
    document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
    const alvo = document.getElementById("tela-" + id);
    if (alvo) alvo.classList.add("ativa");

    if (id === "solicitacoes") carregarSolicitacoes();
    if (id === "aprovar") carregarAprovar();
    if (id === "cadastrar") carregarAnimaisCadastro();
}

function configurarNavegacao() {
    document.querySelectorAll("[data-tela]").forEach(el => {
        el.addEventListener("click", () => mostrarTela(el.dataset.tela));
    });
}

// =========================
// TELA 1: CADASTRAR ANIMAIS
// =========================

async function carregarAnimaisCadastro() {
    const container = document.getElementById("lista-animais-cadastro");
    container.innerHTML = '<p class="carregando-texto">Carregando...</p>';

    const { data, error } = await cliente
        .from("animais")
        .select("id, nome, idade, sexo, porte, descricao, foto_url, status, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar os animais.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhum animal cadastrado ainda.</p>';
        return;
    }

    container.innerHTML = data.map(a => `
        <div class="item-linha">
            <div class="item-info">
                <strong>${escaparTexto(a.nome)}</strong>
                <span class="item-meta">${escaparTexto(a.idade)} · ${escaparTexto(a.sexo)} · ${escaparTexto(a.porte)} — ${escaparTexto(a.status)}</span>
            </div>
            <button type="button" class="btn-excluir-animal" data-id="${a.id}" data-nome="${escaparTexto(a.nome)}">Excluir</button>
        </div>
    `).join("");

    container.querySelectorAll(".btn-excluir-animal").forEach(btn => {
        btn.addEventListener("click", () => confirmarExclusaoAnimal(btn.dataset.id, btn.dataset.nome));
    });
}

async function cadastrarAnimal(evento) {
    evento.preventDefault();
    const feedback = document.getElementById("form-animal-feedback");
    const btnSalvar = document.getElementById("btn-salvar-animal");

    const nome = document.getElementById("animal-nome").value.trim();
    const idade = document.getElementById("animal-idade").value.trim();
    const sexo = document.getElementById("animal-sexo").value;
    const porte = document.getElementById("animal-porte").value;
    const descricao = document.getElementById("animal-descricao").value.trim();
    const fotoInput = document.getElementById("animal-foto");

    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    let fotoUrl = null;

    try {
        if (fotoInput.files && fotoInput.files[0]) {
            const arquivo = fotoInput.files[0];
            if (arquivo.size > 5 * 1024 * 1024) {
                mostrarFeedback(feedback, "A foto deve ter no maximo 5MB.", true);
                return;
            }
            const extensao = arquivo.name.split(".").pop().toLowerCase();
            const caminho = `animais/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
            const { error: uploadErro } = await cliente.storage
                .from("fotos-animais")
                .upload(caminho, arquivo, { contentType: arquivo.type });
            if (uploadErro) throw new Error("Falha ao enviar a foto.");
            const { data: urlData } = cliente.storage.from("fotos-animais").getPublicUrl(caminho);
            fotoUrl = urlData.publicUrl;
        }

        const { error } = await cliente.from("animais").insert({
            nome, idade, sexo, porte, descricao,
            foto_url: fotoUrl,
            status: "Disponível"
        });

        if (error) throw error;

        mostrarFeedback(feedback, "Animal cadastrado com sucesso!", false);
        evento.target.reset();
        carregarAnimaisCadastro();
    } catch (e) {
        mostrarFeedback(feedback, "Erro ao cadastrar: " + (e.message || "tente novamente."), true);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Cadastrar animal";
    }
}

// =========================
// TELA 2: VER SOLICITACOES
// =========================

async function carregarSolicitacoes() {
    const container = document.getElementById("lista-solicitacoes");
    container.innerHTML = '<p class="carregando-texto">Carregando...</p>';

    const { data, error } = await cliente
        .from("adocoes")
        .select("id, nome, telefone, email, cidade, experiencia, motivo, status, created_at, animal_id")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar as solicitações.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhuma solicitação recebida ainda.</p>';
        return;
    }

    const animalIds = [...new Set(data.map(s => s.animal_id).filter(Boolean))];
    let animaisMap = {};
    if (animalIds.length > 0) {
        const { data: animais } = await cliente.from("animais").select("id, nome").in("id", animalIds);
        if (animais) animais.forEach(a => { animaisMap[a.id] = a.nome; });
    }

    container.innerHTML = data.map(s => `
        <div class="item-card">
            <div class="item-card-cabecalho">
                <strong>${escaparTexto(s.nome)}</strong>
                <span class="status-pill status-${s.status.toLowerCase()}">${escaparTexto(s.status)}</span>
            </div>
            <div class="item-card-linhas">
                <span>Animal: ${escaparTexto(s.animal_id ? (animaisMap[s.animal_id] || "—") : "—")}</span>
                <span>E-mail: ${escaparTexto(s.email)}</span>
                <span>Telefone: ${escaparTexto(s.telefone)}</span>
                <span>Cidade: ${escaparTexto(s.cidade)}</span>
                <span>Data: ${formatarData(s.created_at)}</span>
            </div>
            <div class="item-card-texto">
                <p><strong>Experiência:</strong> ${escaparTexto(s.experiencia)}</p>
                <p><strong>Motivo:</strong> ${escaparTexto(s.motivo)}</p>
            </div>
        </div>
    `).join("");
}

// =========================
// TELA 3: APROVAR OU RECUSAR
// =========================

async function carregarAprovar() {
    await carregarPendentes();
    await carregarStatusAnimais();
}

async function carregarPendentes() {
    const container = document.getElementById("lista-pendentes");
    container.innerHTML = '<p class="carregando-texto">Carregando...</p>';

    const { data, error } = await cliente
        .from("adocoes")
        .select("id, nome, telefone, email, cidade, status, created_at, animal_id")
        .eq("status", "Pendente")
        .order("created_at", { ascending: true });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar as solicitações.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhuma solicitação pendente.</p>';
        return;
    }

    const animalIds = [...new Set(data.map(s => s.animal_id).filter(Boolean))];
    let animaisMap = {};
    if (animalIds.length > 0) {
        const { data: animais } = await cliente.from("animais").select("id, nome").in("id", animalIds);
        if (animais) animais.forEach(a => { animaisMap[a.id] = a.nome; });
    }

    container.innerHTML = data.map(s => `
        <div class="item-card">
            <div class="item-card-cabecalho">
                <strong>${escaparTexto(s.nome)}</strong>
                <span class="status-pill status-pendente">${escaparTexto(s.status)}</span>
            </div>
            <div class="item-card-linhas">
                <span>Animal: ${escaparTexto(s.animal_id ? (animaisMap[s.animal_id] || "—") : "—")}</span>
                <span>E-mail: ${escaparTexto(s.email)}</span>
                <span>Telefone: ${escaparTexto(s.telefone)}</span>
                <span>Cidade: ${escaparTexto(s.cidade)}</span>
            </div>
            <div class="item-card-acoes">
                <button type="button" class="btn-aprovar" data-id="${s.id}">Aprovar</button>
                <button type="button" class="btn-recusar" data-id="${s.id}">Recusar</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".btn-aprovar").forEach(btn => {
        btn.addEventListener("click", () => definirStatusSolicitacao(btn.dataset.id, "Aprovado"));
    });
    container.querySelectorAll(".btn-recusar").forEach(btn => {
        btn.addEventListener("click", () => definirStatusSolicitacao(btn.dataset.id, "Recusado"));
    });
}

async function carregarStatusAnimais() {
    const container = document.getElementById("lista-status-animais");
    container.innerHTML = '<p class="carregando-texto">Carregando...</p>';

    const { data, error } = await cliente
        .from("animais")
        .select("id, nome, idade, sexo, porte, status")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar os animais.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhum animal cadastrado.</p>';
        return;
    }

    container.innerHTML = data.map(a => {
        const disponivel = a.status === "Disponível";
        return `
        <div class="item-linha">
            <div class="item-info">
                <strong>${escaparTexto(a.nome)}</strong>
                <span class="item-meta">${escaparTexto(a.idade)} · ${escaparTexto(a.sexo)} · ${escaparTexto(a.porte)}</span>
            </div>
            <button type="button" class="btn-alterar-status ${disponivel ? "btn-adotar" : "btn-disponibilizar"}" data-id="${a.id}" data-status="${escaparTexto(a.status)}">
                ${disponivel ? "Marcar como adotado" : "Marcar como disponível"}
            </button>
        </div>`;
    }).join("");

    container.querySelectorAll(".btn-alterar-status").forEach(btn => {
        btn.addEventListener("click", () => alternarStatusAnimal(btn.dataset.id, btn.dataset.status));
    });
}

// =========================
// ACOES DE STATUS
// =========================

async function alternarStatusAnimal(id, statusAtual) {
    const novoStatus = statusAtual === "Disponível" ? "Adotado" : "Disponível";
    const { error } = await cliente.from("animais").update({ status: novoStatus }).eq("id", id);
    if (!error) carregarStatusAnimais();
}

async function definirStatusSolicitacao(id, novoStatus) {
    const { error } = await cliente.from("adocoes").update({ status: novoStatus }).eq("id", id);
    if (!error) carregarPendentes();
}

// =========================
// EXCLUSAO COM CONFIRMACAO
// =========================

function confirmarExclusaoAnimal(id, nome) {
    const modal = document.getElementById("modal-confirmar");
    document.getElementById("modal-confirmar-texto").textContent =
        `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;
    modal.showModal();

    const confirmar = () => {
        cliente.from("animais").delete().eq("id", id).then(() => {
            modal.close();
            carregarAnimaisCadastro();
        });
    };

    document.getElementById("modal-btn-confirmar").addEventListener("click", confirmar, { once: true });
    document.getElementById("modal-btn-cancelar").addEventListener("click", () => modal.close(), { once: true });
}

// =========================
// INICIALIZACAO
// =========================

document.addEventListener("DOMContentLoaded", async () => {
    const session = await verificarAcesso();
    if (!session) return;

    configurarNavegacao();

    document.getElementById("form-animal").addEventListener("submit", cadastrarAnimal);

    document.getElementById("botao-sair").addEventListener("click", async () => {
        await cliente.auth.signOut();
        window.location.href = "login.html";
    });

    cliente.auth.onAuthStateChange((evento) => {
        if (evento === "SIGNED_OUT") window.location.href = "login.html";
    });
});