// ============================================
// ADOTA PATOS - COMPORTAMENTO DO SITE
// Comunica-se com a estrutura (index.html) via
// ids e classes estaveis e com o tema via classes
// definidas no CSS. Nenhum estilo inline aqui.
// ============================================

if (window.AdotaPatosErros) {
    window.AdotaPatosErros.iniciar();
}

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

// Animal cujo modal esta aberto agora, e animal que o usuario confirmou
// querer adotar. Sao separados de proposito: abrir um modal nao significa
// que a solicitacao passa a ser para aquele animal.
let animalAtualId = null;
let animalSelecionadoId = null;

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
    animalAtualId = botao.dataset.id || null;
    focoAnterior = botao;
    modal.classList.add("active");
    const primeiro = focoDentro(modal);
    if (primeiro) primeiro.focus();
});

closeModal?.addEventListener("click", () => {
    fecharModal(modal);
});

modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
        fecharModal(modal);
    }
});

document.getElementById("adoptButton")?.addEventListener("click", () => {
    // Em modo de teste, n├úo iniciar ado├º├úo real - apenas fechar o modal com aviso
    if (HAS_TEST_PARAM) {
        fecharModal(modal);
        const banner = document.getElementById("test-banner");
        if (banner) {
            banner.classList.toggle("show", true);
        }
        alert("Modo de teste: este ├® um animal fict├¡cio. N├úo ├® poss├¡vel iniciar ado├º├úo real.");
        return;
    }
    animalSelecionadoId = animalAtualId;
    fecharModal(modal);
});

// =========================
// FOCUS TRAP + ESCAPE (modais)
// =========================

let focoAnterior = null;

function focoDentro(modalEl) {
    const alvos = modalEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return alvos.length ? alvos[0] : null;
}

function trancarFoco(event) {
    if (event.key !== "Tab") return;
    const modalAtivo = document.querySelector(".modal.active");
    if (!modalAtivo) return;

    const alvos = modalAtivo.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!alvos.length) return;

    const primeiro = alvos[0];
    const ultimo = alvos[alvos.length - 1];

    if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
    }
}

function fecharModal(modalEl) {
    modalEl.classList.remove("active");
    if (focoAnterior) {
        focoAnterior.focus();
        focoAnterior = null;
    }
    document.removeEventListener("keydown", onEscape);
    document.removeEventListener("keydown", trancarFoco);
}

function onEscape(event) {
    if (event.key !== "Escape") return;
    const modalAtivo = document.querySelector(".modal.active");
    if (modalAtivo) fecharModal(modalAtivo);
}

document.addEventListener("keydown", onEscape);
document.addEventListener("keydown", trancarFoco);

// =========================
// FORMULARIO DE ADOCAO
// =========================

const adoptionForm = document.getElementById("adoptionForm");
const motivoCampo = document.getElementById("reason");
const contadorMotivo = document.getElementById("contador-motivo");

motivoCampo?.addEventListener("input", () => {
    contadorMotivo.textContent = motivoCampo.value.length + "/300";
});

adoptionForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botao = adoptionForm.querySelector("button[type=submit]") || adoptionForm.querySelector("button");
    const textoOriginal = botao ? botao.textContent : "";
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Enviando...";
    }

    const dados = {
        animal_id: animalSelecionadoId,
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
        if (resultado.ok) {
            adoptionForm.reset();
            animalSelecionadoId = null;
        }
        if (contadorMotivo) contadorMotivo.textContent = "0/300";
    } catch (e) {
        mostrarFeedback("erro", "N├úo conseguimos enviar agora. Verifique sua internet e tente novamente.");
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

if (menuMobile && navUl) {
    menuMobile.addEventListener("click", () => {
        navUl.classList.toggle("aberto");
    });

    // Fecha o menu ao clicar em um link
    navUl.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            navUl.classList.remove("aberto");
        }
    });
}

// =========================
// HEADER DROPDOWN (├¡cone Ôÿ░ no canto direito)
// =========================

const headerDropdown = document.querySelector(".header-dropdown");
const headerDropdownBtn = document.querySelector(".header-dropdown-btn");
const headerDropdownMenu = document.querySelector(".header-dropdown-menu");

// Detecta dispositivo com toque
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Helper: verifica se o menu est├í aberto por qualquer mecanismo
function isMenuOpen() {
    return headerDropdown.classList.contains('open') ||
           headerDropdown.matches(':hover') ||
           headerDropdown.matches(':focus-within');
}

if (headerDropdown && headerDropdownBtn && headerDropdownMenu) {
    // Click toggle apenas em dispositivos de toque (mobile)
    if (isTouchDevice) {
        headerDropdownBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = headerDropdown.classList.toggle('open');
            headerDropdownBtn.setAttribute('aria-expanded', isOpen);
        });
    }

    // Fecha ao clicar fora (funciona em desktop e mobile)
    document.addEventListener('click', (event) => {
        if (!headerDropdown.contains(event.target)) {
            headerDropdown.classList.remove('open');
            headerDropdown.classList.remove('dropdown-escaped');
            headerDropdownBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Fecha com Escape (acessibilidade) - fecha independente de como abriu
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMenuOpen()) {
            headerDropdown.classList.remove('open');
            headerDropdown.classList.add('dropdown-escaped');
            headerDropdownBtn.setAttribute('aria-expanded', 'false');
            headerDropdownBtn.focus();
            // O bloqueio persiste at├® o usu├írio sair da ├írea do menu (hover E focus)
        }
    });

    // Fecha ao clicar em um item do menu
    headerDropdownMenu.addEventListener('click', (event) => {
        if (event.target.closest('.header-dropdown-item')) {
            headerDropdown.classList.remove('open');
            headerDropdown.classList.remove('dropdown-escaped');
            headerDropdownBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Helper: verifica se deve remover o bloqueio de Escape
    function maybeRemoveEscaped() {
        if (headerDropdown.classList.contains('dropdown-escaped') &&
            !headerDropdown.matches(':hover') &&
            !headerDropdown.matches(':focus-within')) {
            headerDropdown.classList.remove('dropdown-escaped');
        }
    }

    // Sincroniza aria-expanded no hover (desktop) para leitores de tela
    if (!isTouchDevice) {
        headerDropdown.addEventListener('mouseenter', () => {
            headerDropdownBtn.setAttribute('aria-expanded', 'true');
        });
        headerDropdown.addEventListener('mouseleave', () => {
                    // S├│ define false se n├úo estiver aberto via foco ou classe open
                    if (!headerDropdown.classList.contains('open') &&
                        !headerDropdown.matches(':focus-within')) {
                        headerDropdownBtn.setAttribute('aria-expanded', 'false');
                    }
                    maybeRemoveEscaped();
                });
    }

    // Sincroniza aria-expanded no foco do teclado (Tab)
    headerDropdownBtn.addEventListener('focus', () => {
        headerDropdownBtn.setAttribute('aria-expanded', 'true');
    });
    headerDropdownBtn.addEventListener('blur', () => {
        // Pequeno delay para permitir movimento de foco para op├º├Áes do menu
        setTimeout(() => {
            // S├│ define false se o menu n├úo estiver aberto via hover, foco ou classe open
            if (!isMenuOpen()) {
                headerDropdownBtn.setAttribute('aria-expanded', 'false');
            }
            maybeRemoveEscaped();
        }, 0);
    });

    // Tamb├®m sincroniza quando o foco entra/sai das op├º├Áes do menu
    headerDropdownMenu.addEventListener('focusin', () => {
        headerDropdownBtn.setAttribute('aria-expanded', 'true');
    });
    headerDropdownMenu.addEventListener('focusout', () => {
        // Pequeno delay para permitir movimento de foco dentro do menu
        setTimeout(() => {
            if (!isMenuOpen()) {
                headerDropdownBtn.setAttribute('aria-expanded', 'false');
            }
            maybeRemoveEscaped();
        }, 0);
    });
}

// =========================
// HEADER COM SOMBRA AO ROLAR
// =========================

const siteHeader = document.querySelector("header");

window.addEventListener("scroll", () => {
    if (siteHeader) siteHeader.classList.toggle("scrolled", window.scrollY > 20);
}, { passive: true });

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

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

// =========================
// COOKIES (LGPD): o Google Analytics ├® estat├¡stica de visitas.
// Por respeito ao visitante (e pela LGPD), ele S├ô entra em cena
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
        '<span>­ƒì¬ Usamos cookies apenas para estat├¡sticas an├┤nimas de acesso. Podemos continuar?</span>';

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

const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]')?.content || "https://fnlqruzbgwffhrqmpfvi.supabase.co";
const SUPABASE_KEY = document.querySelector('meta[name="supabase-key"]')?.content || "";

// Modo de teste: par├ómetro qa_animais na URL (ex: ?qa_animais=3)
const urlParams = new URLSearchParams(window.location.search);
const HAS_TEST_PARAM = urlParams.has('qa_animais');
const TEST_COUNT = HAS_TEST_PARAM ? Math.max(0, parseInt(urlParams.get('qa_animais') || '0', 10)) : 0;

// Mock animals for test mode (10 distinct test animals - never written to Supabase)
const MOCK_ANIMALS = [
    { id: "test-1", nome: "Thor", idade: "2 anos", sexo: "Macho", porte: "M├®dio", pelagem: "Curta", descricao: "Thor ├® brincalh├úo, carinhoso e est├í procurando uma fam├¡lia para chamar de sua. Gosta de caminhadas e deitar no sof├í ao final do dia.", foto_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80" },
    { id: "test-2", nome: "Bob", idade: "3 anos", sexo: "Macho", porte: "Grande", pelagem: "Curta", descricao: "Bob ├® um c├úo tranquilo e protetor. Adora crian├ºas e ├® perfeito para casas com quintal. J├í est├í castrado e vacinado.", foto_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80" },
    { id: "test-3", nome: "Luna", idade: "1 ano", sexo: "F├¬mea", porte: "Pequeno", pelagem: "Curta", descricao: "Luna ├® uma gata d├│cil e curiosa. Perfeita para apartamentos. Ama brincar com laser e dormir no colo. J├í foi esterilizada.", foto_url: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80" },
    { id: "test-4", nome: "Maya", idade: "4 anos", sexo: "F├¬mea", porte: "M├®dio", pelagem: "Curta", descricao: "Maya tem um cora├º├úo enorme. Foi resgatada ap├│s neglig├¬ncia. Agora saud├ível e cheia de amor para dar. Procura um lar tranquilo.", foto_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80" },
    { id: "test-5", nome: "Rex", idade: "5 anos", sexo: "Macho", porte: "Grande", pelagem: "Curta", descricao: "Rex ├® fiel e protetor. Adora passeios pela manh├ú e brincar no parque. Castrado, vacinado e muito carinhoso.", foto_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80" },
    { id: "test-6", nome: "Nina", idade: "8 meses", sexo: "F├¬mea", porte: "Pequeno", pelagem: "Curta", descricao: "Nina ├® uma filhotinha cheia de energia! Brinca o dia todo, gosta de bolas e j├í se d├í bem com gatos adultos.", foto_url: "https://images.unsplash.com/photo-1574158622682-e4e8528bce91?auto=format&fit=crop&w=800&q=80" },
    { id: "test-7", nome: "Cooper", idade: "6 meses", sexo: "Macho", porte: "Pequeno", pelagem: "Curta", descricao: "Cooper ├® um labrador energeticamente vibrante, adora morder brinquedos e j├í aprendeu a sentar e a dar a pata. Est├í pronto para uma aventura.", foto_url: "https://images.unsplash.com/photo-1552788004-e28d3d7331f1?auto=format&fit=crop&w=800&q=80" },
    { id: "test-8", nome: "Bella", idade: "9 meses", sexo: "F├¬mea", porte: "M├®dio", pelagem: "M├®dia", descricao: "Bella ├® uma labradoodle fofa e inteligente, que adora passar tempo com seus donos. J├í aprendeu comandos b├ísicos e ├® ├│tima para fam├¡lias com crian├ºas.", foto_url: "https://images.unsplash.com/photo-1568980306537-809ead8c6b46?auto=format&fit=crop&w=800&q=80" },
    { id: "test-9", nome: "Duke", idade: "4 anos", sexo: "Macho", porte: "Grande", pelagem: "Curta", descricao: "Duke ├® um grande golden retriever gentil, que adora passear e nadar. Tem um cora├º├úo gentil e ├® muito protetor da fam├¡lia.", foto_url: "https://images.unsplash.com/photo-1516589828629-1b0e972d6e1f?auto=format&fit=crop&w=800&q=80" },
    { id: "test-10", nome: "Maggie", idade: "7 anos", sexo: "F├¬mea", porte: "M├®dio", pelagem: "Curta", descricao: "Maggie ├® uma shih tzu de personalidade forte, que adora ser o centro das aten├º├Áes. Tem um sorriso contagiante e adora cochilar no colo dos donos.", foto_url: "https://images.unsplash.com/photo-1543466836-0316270297e2?auto=format&fit=crop&w=800&q=80" },
    { id: "test-11", nome: "Pedro", idade: "2 anos", sexo: "Macho", porte: "M├®dio", pelagem: "Curta", descricao: "Pedro ├® um colaborador que gosta de ajudar no resgate de animais. Adora brincar com c├úes e est├í sempre disposto a ajudar.", foto_url: "https://images.unsplash.com/photo-1551187580-506f4b3d1e3d?auto=format&fit=crop&w=800&q=80" },
    { id: "test-12", nome: "Carolina", idade: "3 anos", sexo: "F├¬mea", porte: "M├®dio", pelagem: "Longa", descricao: "Carolina ├® uma cata-vento muito doce, mas um pouco t├¡mida. Ama ficar no colo e ├® ├│tima com crian├ºas.", foto_url: "https://images.unsplash.com/photo-1574158622682-e4e8528bce91?auto=format&fit=crop&w=800&q=80" },
    { id: "test-13", nome: "Z├®", idade: "5 anos", sexo: "Macho", porte: "Grande", pelagem: "Curta", descricao: "Z├® ├® um pastor alem├úo treinado, obediente e leal. Ideal para quem busca um c├úo guardi├úo e companheiro.", foto_url: "https://images.unsplash.com/photo-1546626010-289c32519324?auto=format&fit=crop&w=800&q=80" },
    { id: "test-14", nome: "Tico", idade: "2 anos", sexo: "Macho", porte: "Pequeno", pelagem: "Curta", descricao: "Tico ├® um chihuahua pequeno e corajoso, cheio de energia. Adora brincar e fazer amigos com todos.", foto_url: "https://images.unsplash.com/photo-1552788004-e28d3d7331f1?auto=format&fit=crop&w=800&q=80" },
    { id: "test-15", nome: "Jos├®", idade: "4 anos", sexo: "Macho", porte: "Grande", pelagem: "Curta", descricao: "Jos├® ├® um colaborador dedicado. Sempre est├í por perto, ajuda a cuidar dos animais e faz parte da equipe com carinho.", foto_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80" }
];
;

function mensagemCatalogo(texto, erro = false, tentarNovamente = null) {
    const p = document.createElement("p");
    p.className = "catalogo-status" + (erro ? " erro" : "");
    p.textContent = texto;
    if (tentarNovamente) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn";
        botao.textContent = "Tentar novamente";
        botao.addEventListener("click", tentarNovamente);
        p.appendChild(document.createElement("br"));
        p.appendChild(botao);
    }
    return p;
}

async function carregarAnimais() {
    const container = document.getElementById("catalogo-animais");
    const banner = document.getElementById("test-banner");
    if (!container) return;

    const useTestMode = HAS_TEST_PARAM;
    if (banner) {
        banner.classList.toggle("show", useTestMode);
    }

    if (useTestMode) {
        container.innerHTML = "";
        const animais = MOCK_ANIMALS.slice(0, TEST_COUNT || MOCK_ANIMALS.length);
        if (!animais.length) {
            container.appendChild(mensagemCatalogo("­ƒÉò Nenhum animal dispon├¡vel no modo de teste."));
            return;
        }
        container.innerHTML = animais.map((animal) => `\n            <article class="animal-card">\n                <span class="ribbon">Dispon├¡vel</span>\n                <div class="img-wrap">\n                    <img src="${animal.foto_url.startsWith("https://") ? animal.foto_url : ""}" alt="${animal.nome.replace(/"/g,'&quot;')}" loading="lazy">\n                </div>\n                <div class="animal-info">\n                    <h3>${animal.nome.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h3>\n                    <div class="animal-details">\n                        <span class="tag">${animal.idade.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                        <span class="tag">${animal.sexo.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                        <span class="tag">${animal.porte.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                        <span class="tag">${animal.pelagem ? animal.pelagem.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</span>\n                    </div>\n                    <p>${(animal.descricao || "").slice(0,140).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>\n                    <button class="btn btn-details"\n                        data-name="${animal.nome.replace(/"/g,'&quot;')}" data-age="${animal.idade.replace(/"/g,'&quot;')}"\n                        data-sex="${animal.sexo.replace(/"/g,'&quot;')}" data-size="${animal.porte.replace(/"/g,'&quot;')}"\n                        data-description="${(animal.descricao||"").replace(/"/g,'&quot;')}"\n                        data-image="${animal.foto_url.startsWith("https://") ? animal.foto_url : ""}"\n                        data-id="${animal.id.replace(/"/g,'&quot;')}">\n                        Conhecer ${animal.nome.split(" ")[0]}\n                    </button>\n                </div>\n            </article>`).join("");
        return;
    }

    container.innerHTML = "";
    container.appendChild(mensagemCatalogo("Carregando animais... ­ƒÉ¥"));
    try {
        const resposta = await fetch(SUPABASE_URL + "/rest/v1/animais?status=eq.Dispon%C3%ADvel&select=id,nome,idade,sexo,porte,pelagem,descricao,foto_url&order=created_at.desc", {
            headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }
        });
        if (!resposta.ok) throw new Error("HTTP " + resposta.status);
        const animais = await resposta.json();

        // Seguran├ºa: todo texto vindo do banco ├® escapado antes de
        // virar HTML. Assim um cadastro mal-intencionado nunca
        // consegue injetar c├│digo na p├ígina (XSS).
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
            container.innerHTML = "";
            container.appendChild(
                mensagemCatalogo("­ƒÉò No momento todos os nossos amiguinhos j├í encontraram uma fam├¡lia ÔÇö volte logo, novos resgates chegam toda semana!")
            );
            return;
        }

        container.innerHTML = animais.map((animal) => `
            <article class="animal-card">
                <span class="ribbon">Dispon├¡vel</span>
                <div class="img-wrap">
                    <img src="${urlDeFotoSegura(animal.foto_url)}" alt="${escaparHtml(animal.nome)}" loading="lazy">
                </div>
                <div class="animal-info">
                    <h3>${escaparHtml(animal.nome)}</h3>
                    <div class="animal-details">
                        <span class="tag">${escaparHtml(animal.idade)}</span>
                        <span class="tag">${escaparHtml(animal.sexo)}</span>
                        <span class="tag">${escaparHtml(animal.porte)}</span>
                        ${animal.pelagem ? `<span class="tag">${escaparHtml(animal.pelagem)}</span>` : ''}
                    </div>
                    <p>${escaparHtml((animal.descricao || "").slice(0, 140))}</p>
                    <button class="btn btn-details"
                        data-name="${escaparHtml(animal.nome)}" data-age="${escaparHtml(animal.idade)}"
                        data-sex="${escaparHtml(animal.sexo)}" data-size="${escaparHtml(animal.porte)}"
                        data-description="${escaparHtml(animal.descricao || "")}"
                        data-image="${urlDeFotoSegura(animal.foto_url)}"
                        data-id="${escaparHtml(animal.id)}">
                        Conhecer ${escaparHtml(animal.nome.split(" ")[0])}
                    </button>
                </div>
            </article>`).join("");
    } catch (erro) {
        // Troca o loading pela mensagem de erro. Sem esta limpeza os dois
        // textos ficariam na tela ao mesmo tempo.
        container.innerHTML = "";
        container.appendChild(
            mensagemCatalogo("N├úo conseguimos carregar os animais agora. ­ƒÉ¥", true, carregarAnimais)
        );
    }
}

carregarAnimais();

// =========================
// MODAL DA POLITICA DE PRIVACIDADE
// =========================

const politicaModal = document.getElementById("politicaModal");

if (politicaModal) {
    document.querySelectorAll(".abrir-politica").forEach((botao) => {
        botao.addEventListener("click", () => {
            focoAnterior = botao;
            politicaModal.classList.add("active");
            const primeiro = focoDentro(politicaModal);
            if (primeiro) primeiro.focus();
        });
    });

    document.getElementById("fecharPolitica")?.addEventListener("click", () => {
        fecharModal(politicaModal);
    });

    politicaModal.addEventListener("click", (event) => {
        if (event.target === politicaModal) {
            fecharModal(politicaModal);
        }
    });
}
