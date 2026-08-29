// ============================================
// ADOTA PATOS - COMPORTAMENTO DO SITE
// Comunica-se com a estrutura (index.html) via
// ids e classes estaveis e com o tema via classes
// definidas no CSS. Nenhum estilo inline aqui.
// ============================================

// =========================
// MODAL DOS ANIMAIS
// =========================

const modal = document.getElementById("animalModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalAge = document.getElementById("modalAge");
const modalSex = document.getElementById("modalSex");
const modalSize = document.getElementById("modalSize");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.getElementById("closeModal");

document.addEventListener("click", (event) => {
    const botao = event.target.closest(".btn-details");
    if (!botao) return;

    modalImage.src = botao.dataset.image;
    modalImage.alt = botao.dataset.name;
    modalName.textContent = botao.dataset.name;
    modalAge.textContent = botao.dataset.age;
    modalSex.textContent = botao.dataset.sex;
    modalSize.textContent = botao.dataset.size;
    modalDescription.textContent = botao.dataset.description;
    modal.classList.add("active");
});

closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.classList.remove("active");
    }
});

document.getElementById("adoptButton").addEventListener("click", () => {
    modal.classList.remove("active");
});

// =========================
// FORMULARIO DE ADOCAO
// =========================

const adoptionForm = document.getElementById("adoptionForm");
const motivoCampo = document.getElementById("reason");
const contadorMotivo = document.getElementById("contador-motivo");

motivoCampo.addEventListener("input", () => {
    contadorMotivo.textContent = motivoCampo.value.length + "/300";
});

adoptionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botao = adoptionForm.querySelector("button[type=submit]") || adoptionForm.querySelector("button");
    const textoOriginal = botao ? botao.textContent : "";
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Enviando...";
    }

    const dados = {
        nome: document.getElementById("name").value.trim(),
        telefone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        cidade: document.getElementById("city").value.trim(),
        experiencia: document.getElementById("experience").value,
        motivo: motivoCampo.value.trim(),
        consentimento: document.getElementById("consentimento-lgpd").checked,
        website: document.getElementById("website").value
    };

    try {
        const resposta = await fetch("https://fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/receber-adocao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();
        mostrarFeedback(
            resultado.ok ? "sucesso" : "erro",
            resultado.mensagem + (resultado.erros ? " " + resultado.erros.join(" ") : "")
        );
        if (resultado.ok) adoptionForm.reset();
        if (contadorMotivo) contadorMotivo.textContent = "0/300";
    } catch (e) {
        mostrarFeedback("erro", "Não conseguimos enviar agora. Verifique sua internet e tente novamente.");
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    }
});

function mostrarFeedback(tipo, texto) {
    let area = document.getElementById("form-feedback");
    if (!area) {
        area = document.createElement("div");
        area.id = "form-feedback";
        area.className = "form-feedback";
        adoptionForm.prepend(area);
    }
    area.classList.toggle("sucesso", tipo === "sucesso");
    area.classList.toggle("erro", tipo === "erro");
    area.textContent = (tipo === "sucesso" ? "🐶 " : "⚠️ ") + texto;
    area.scrollIntoView({ behavior: "smooth", block: "center" });
}

// =========================
// MENU MOBILE
// =========================

const menuMobile = document.querySelector(".menu-mobile");
const navUl = document.querySelector("nav ul");

menuMobile.addEventListener("click", () => {
    navUl.classList.toggle("aberto");
});

// Fecha o menu ao clicar em um link
navUl.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
        navUl.classList.remove("aberto");
    }
});

// =========================
// HEADER COM SOMBRA AO ROLAR
// =========================

const siteHeader = document.querySelector("header");

window.addEventListener("scroll", () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 20);
});

// =========================
// ANIMACAO AO ROLAR (REVEAL)
// =========================

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// =========================
// COOKIES (LGPD): o Google Analytics é estatística de visitas.
// Por respeito ao visitante (e pela LGPD), ele SÓ entra em cena
// depois que a pessoa aceita. Quem recusa navega sem analytics.
// =========================

const GA_MEASUREMENT_ID = "G-S08M6034SR"; // propriedade GA4 oficial da ONG

function obterConsentimentoCookies() {
    return localStorage.getItem("consentimento-cookies");
}

function carregarGoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) return; // sem conta configurada, nada a carregar
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
}

const escolhaSalva = obterConsentimentoCookies();

if (escolhaSalva === "aceito") {
    carregarGoogleAnalytics();
} else if (!escolhaSalva) {
    const banner = document.createElement("div");
    banner.id = "banner-cookies";
    banner.className = "banner-cookies";
    banner.innerHTML =
        '<span>🍪 Usamos cookies apenas para estatísticas anônimas de acesso. Podemos continuar?</span>';

    const botaoAceitar = document.createElement("button");
    botaoAceitar.type = "button";
    botaoAceitar.textContent = "Aceitar";
    botaoAceitar.className = "btn";

    const botaoRecusar = document.createElement("button");
    botaoRecusar.type = "button";
    botaoRecusar.textContent = "Recusar";
    botaoRecusar.className = "recusar";

    banner.append(botaoAceitar, botaoRecusar);
    document.body.appendChild(banner);

    botaoAceitar.addEventListener("click", () => {
        localStorage.setItem("consentimento-cookies", "aceito");
        banner.remove();
        carregarGoogleAnalytics();
    });

    botaoRecusar.addEventListener("click", () => {
        localStorage.setItem("consentimento-cookies", "recusado");
        banner.remove(); // sem analytics: o site funciona exatamente igual
    });
}

// =========================
// CATALOGO DINAMICO (Supabase)
// =========================

const SUPABASE_URL = "https://fnlqruzbgwffhrqmpfvi.supabase.co";
const SUPABASE_KEY = "sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR";

function mensagemCatalogo(texto, erro = false) {
    const p = document.createElement("p");
    p.className = "catalogo-status" + (erro ? " erro" : "");
    p.textContent = texto;
    return p;
}

async function carregarAnimais() {
    const container = document.getElementById("catalogo-animais");
    try {
        const resposta = await fetch(SUPABASE_URL + "/rest/v1/animais?status=eq.Dispon%C3%ADvel&select=id,nome,idade,sexo,porte,descricao,foto_url&order=created_at.desc", {
            headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }
        });
        if (!resposta.ok) throw new Error("HTTP " + resposta.status);
        const animais = await resposta.json();

        // Segurança: todo texto vindo do banco é escapado antes de
        // virar HTML. Assim um cadastro mal-intencionado nunca
        // consegue injetar código na página (XSS).
        function escaparHtml(valor) {
            return String(valor ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#39;");
        }
        function urlDeFotoSegura(url) {
            const limpa = escaparHtml(url);
            return limpa.startsWith("https://") ? limpa : "";
        }

        if (!animais.length) {
            container.appendChild(
                mensagemCatalogo("🐕 No momento todos os nossos amiguinhos já encontraram uma família — volte logo, novos resgates chegam toda semana!")
            );
            return;
        }

        container.innerHTML = animais.map((animal) => `
            <article class="animal-card">
                <span class="ribbon">Disponível</span>
                <div class="img-wrap">
                    <img src="${urlDeFotoSegura(animal.foto_url)}" alt="${escaparHtml(animal.nome)}" loading="lazy">
                </div>
                <div class="animal-info">
                    <h3>${escaparHtml(animal.nome)}</h3>
                    <div class="animal-details">
                        <span class="tag">${escaparHtml(animal.idade)}</span>
                        <span class="tag">${escaparHtml(animal.sexo)}</span>
                        <span class="tag">${escaparHtml(animal.porte)}</span>
                    </div>
                    <p>${escaparHtml((animal.descricao || "").slice(0, 140))}</p>
                    <button class="btn btn-details"
                        data-name="${escaparHtml(animal.nome)}" data-age="${escaparHtml(animal.idade)}"
                        data-sex="${escaparHtml(animal.sexo)}" data-size="${escaparHtml(animal.porte)}"
                        data-description="${escaparHtml(animal.descricao || "")}"
                        data-image="${urlDeFotoSegura(animal.foto_url)}">
                        Conhecer ${escaparHtml(animal.nome.split(" ")[0])}
                    </button>
                </div>
            </article>`).join("");
    } catch (erro) {
        container.appendChild(
            mensagemCatalogo("Não conseguimos carregar os animais agora. Recarregue a página em instantes. 🐾", true)
        );
    }
}

carregarAnimais();

// =========================
// MODAL DA POLITICA DE PRIVACIDADE
// =========================

const politicaModal = document.getElementById("politicaModal");

document.querySelectorAll(".abrir-politica").forEach((botao) => {
    botao.addEventListener("click", () => politicaModal.classList.add("active"));
});

document.getElementById("fecharPolitica").addEventListener("click", () => {
    politicaModal.classList.remove("active");
});

politicaModal.addEventListener("click", (event) => {
    if (event.target === politicaModal) {
        politicaModal.classList.remove("active");
    }
});