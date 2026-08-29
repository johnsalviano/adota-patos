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

// =========================
// GUARDA DE ACESSO
// =========================

async function verificarAcesso() {
    const { data: { session } } = await cliente.auth.getSession();
    if (!session) { window.location.href = "login.html"; return null; }

    const { data: membro } = await cliente.rpc("eh_membro_ong");
    if (!membro) { await cliente.auth.signOut(); window.location.href = "login.html"; return null; }

    document.getElementById("email-logado").textContent = session.user.email || "";
    document.getElementById("tela-carregando").classList.add("oculto");
    document.getElementById("conteudo-painel").classList.remove("oculto");
    return session;
}

// =========================
// ABAS
// =========================

function configurarAbas() {
    document.querySelectorAll(".aba").forEach(aba => {
        aba.addEventListener("click", () => {
            document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
            document.querySelectorAll(".conteudo-aba").forEach(c => c.classList.remove("ativo"));
            aba.classList.add("ativa");
            document.getElementById("aba-" + aba.dataset.aba).classList.add("ativo");

            if (aba.dataset.aba === "solicitacoes") carregarSolicitacoes();
        });
    });
}

// =========================
// CRUD ANIMAIS
// =========================

async function carregarAnimais() {
    const container = document.getElementById("lista-animais");
    const { data, error } = await cliente
        .from("animais")
        .select("id, nome, idade, sexo, porte, descricao, foto_url, status, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar animais.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhum animal cadastrado ainda.</p>';
        return;
    }

    container.innerHTML = data.map(a => `
        <div class="animal-item" data-id="${a.id}">
            <img src="${a.foto_url || ""}" alt="${escaparTexto(a.nome)}" class="animal-thumb">
            <div class="animal-info">
                <strong>${escaparTexto(a.nome)}</strong>
                <span class="animal-meta">${escaparTexto(a.idade)} · ${escaparTexto(a.sexo)} · ${escaparTexto(a.porte)}</span>
                <span class="animal-status ${a.status === 'Disponível' ? 'status-disponivel' : 'status-indisponivel'}">${escaparTexto(a.status)}</span>
            </div>
            <div class="animal-acoes">
                <button type="button" class="btn-acao btn-alterar-status" data-id="${a.id}" data-status="${a.status}">
                    ${a.status === "Disponível" ? "Marcar como adotado" : "Marcar como disponível"}
                </button>
                <button type="button" class="btn-acao btn-excluir-animal" data-id="${a.id}" data-nome="${escaparTexto(a.nome)}">
                    Excluir
                </button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".btn-alterar-status").forEach(btn => {
        btn.addEventListener("click", () => alternarStatusAnimal(btn.dataset.id, btn.dataset.status));
    });

    container.querySelectorAll(".btn-excluir-animal").forEach(btn => {
        btn.addEventListener("click", () => confirmarExclusao(btn.dataset.id, btn.dataset.nome));
    });

    container.querySelectorAll(".animal-thumb").forEach(img => {
        img.addEventListener("error", () => { img.classList.add("oculta"); });
    });
}

async function cadastrarAnimal(evento) {
    evento.preventDefault();
    const form = evento.target;
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
        // Upload da foto se houver
        if (fotoInput.files && fotoInput.files[0]) {
            const arquivo = fotoInput.files[0];
            if (arquivo.size > 5 * 1024 * 1024) {
                mostrarFeedback(feedback, "Foto deve ter no maximo 5MB.", true);
                return;
            }
            const extensao = arquivo.name.split(".").pop();
            const caminho = `animais/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
            const { error: uploadErro } = await cliente.storage
                .from("fotos-animais")
                .upload(caminho, arquivo, { contentType: arquivo.type });
            if (uploadErro) throw uploadErro;
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
        form.reset();
        carregarAnimais();
    } catch (e) {
        mostrarFeedback(feedback, "Erro ao cadastrar: " + (e.message || "tente novamente."), true);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Cadastrar animal";
    }
}

async function alternarStatusAnimal(id, statusAtual) {
    const novoStatus = statusAtual === "Disponível" ? "Adotado" : "Disponível";
    const { error } = await cliente.from("animais").update({ status: novoStatus }).eq("id", id);
    if (!error) carregarAnimais();
}

function confirmarExclusao(id, nome) {
    const modal = document.getElementById("modal-confirmar");
    document.getElementById("modal-confirmar-texto").textContent =
        `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;
    modal.showModal();

    const btnConfirmar = document.getElementById("modal-btn-confirmar");
    const btnCancelar = document.getElementById("modal-btn-cancelar");

    const fechar = () => { modal.close(); btnConfirmar.replaceWith(btnConfirmar.cloneNode(true)); btnCancelar.replaceWith(btnCancelar.cloneNode(true)); };

    document.getElementById("modal-btn-confirmar").addEventListener("click", async () => {
        await cliente.from("animais").delete().eq("id", id);
        fechar();
        carregarAnimais();
    });
    document.getElementById("modal-btn-cancelar").addEventListener("click", fechar);
}

// =========================
// SOLICITACOES DE ADOCAO
// =========================

async function carregarSolicitacoes() {
    const container = document.getElementById("lista-solicitacoes");
    container.innerHTML = '<p class="carregando-texto">Carregando...</p>';

    const { data, error } = await cliente
        .from("adocoes")
        .select("id, nome, telefone, email, cidade, experiencia, motivo, status, created_at, animal_id")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = '<p class="erro-texto">Erro ao carregar solicitações.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="vazio-texto">Nenhuma solicitação recebida ainda.</p>';
        return;
    }

    // Busca nomes dos animais para exibir
    const animalIds = [...new Set(data.map(s => s.animal_id).filter(Boolean))];
    let animaisMap = {};
    if (animalIds.length > 0) {
        const { data: animais } = await cliente.from("animais").select("id, nome").in("id", animalIds);
        if (animais) animais.forEach(a => { animaisMap[a.id] = a.nome; });
    }

    container.innerHTML = data.map(s => {
        const dataFmt = new Date(s.created_at).toLocaleDateString("pt-BR");
        const animalNome = s.animal_id ? animaisMap[s.animal_id] || "—" : "—";
        const statusClasse = s.status === "Aprovado" ? "status-aprovado" :
                             s.status === "Recusado" ? "status-recusado" : "status-pendente";
        return `
        <div class="solicitacao-item" data-id="${s.id}">
            <div class="solicitacao-cabecalho">
                <strong>${escaparTexto(s.nome)}</strong>
                <span class="solicitacao-status ${statusClasse}">${escaparTexto(s.status)}</span>
            </div>
            <div class="solicitacao-detalhes">
                <span>Animal: ${escaparTexto(animalNome)}</span>
                <span>Email: ${escaparTexto(s.email)}</span>
                <span>Telefone: ${escaparTexto(s.telefone)}</span>
                <span>Cidade: ${escaparTexto(s.cidade)}</span>
                <span>Data: ${dataFmt}</span>
            </div>
            <div class="solicitacao-texto">
                <p><strong>Experiência:</strong> ${escaparTexto(s.experiencia)}</p>
                <p><strong>Motivo:</strong> ${escaparTexto(s.motivo)}</p>
            </div>
            ${s.status === "Pendente" ? `
            <div class="solicitacao-acoes">
                <button type="button" class="btn-acao btn-aprovar" data-id="${s.id}">Aprovar</button>
                <button type="button" class="btn-acao btn-recusar" data-id="${s.id}">Recusar</button>
            </div>` : ""}
        </div>`;
    }).join("");

    container.querySelectorAll(".btn-aprovar").forEach(btn => {
        btn.addEventListener("click", () => atualizarSolicitacao(btn.dataset.id, "Aprovado"));
    });
    container.querySelectorAll(".btn-recusar").forEach(btn => {
        btn.addEventListener("click", () => atualizarSolicitacao(btn.dataset.id, "Recusado"));
    });
}

async function atualizarSolicitacao(id, novoStatus) {
    const { error } = await cliente.from("adocoes").update({ status: novoStatus }).eq("id", id);
    if (!error) carregarSolicitacoes();
}

// =========================
// INICIALIZACAO
// =========================

document.addEventListener("DOMContentLoaded", async () => {
    const session = await verificarAcesso();
    if (!session) return;

    configurarAbas();

    document.getElementById("form-animal").addEventListener("submit", cadastrarAnimal);
    document.getElementById("botao-sair").addEventListener("click", async () => {
        await cliente.auth.signOut();
        window.location.href = "login.html";
    });

    cliente.auth.onAuthStateChange((evento) => {
        if (evento === "SIGNED_OUT") window.location.href = "login.html";
    });

    carregarAnimais();
});
