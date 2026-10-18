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
// HEADER DROPDOWN (ícone ☰ no canto direito)
// =========================

const headerDropdown = document.querySelector(".header-dropdown");
const headerDropdownBtn = document.querySelector(".header-dropdown-btn");
const headerDropdownMenu = document.querySelector(".header-dropdown-menu");

// Detecta dispositivo com toque
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Helper: verifica se o menu está aberto por qualquer mecanismo
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
            // O bloqueio persiste até o usuário sair da área do menu (hover E focus)
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
                    // Só define false se não estiver aberto via foco ou classe open
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
        // Pequeno delay para permitir movimento de foco para opções do menu
        setTimeout(() => {
            // Só define false se o menu não estiver aberto via hover, foco ou classe open
            if (!isMenuOpen()) {
                headerDropdownBtn.setAttribute('aria-expanded', 'false');
            }
            maybeRemoveEscaped();
        }, 0);
    });

    // Também sincroniza quando o foco entra/sai das opções do menu
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

const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]')?.content || "https://fnlqruzbgwffhrqmpfvi.supabase.co";
const SUPABASE_KEY = document.querySelector('meta[name="supabase-key"]')?.content || "";

// Modo de teste: parâmetro qa_animais na URL (ex: ?qa_animais=3)
const urlParams = new URLSearchParams(window.location.search);
const HAS_TEST_PARAM = urlParams.has('qa_animais');
const TEST_COUNT = HAS_TEST_PARAM ? Math.max(0, parseInt(urlParams.get('qa_animais') || '0')) : 0;

// Mock animals for test mode (6 distinct test animals - never written to Supabase)
const MOCK_ANIMALS = [
    { id: "test-1", nome: "Thor", idade: "2 anos", sexo: "Macho", porte: "Médio", descricao: "Thor é brincalhão, carinhoso e está procurando uma família para chamar de sua. Gosta de caminhadas e deitar no sofá ao final do dia.", foto_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80" },
    { id: "test-2", nome: "Bob", idade: "3 anos", sexo: "Macho", porte: "Grande", descricao: "Bob é um cão tranquilo e protetor. Adora crianças e é perfeito para casas com quintal. Já está castrado e vacinado.", foto_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80" },
    { id: "test-3", nome: "Luna", idade: "1 ano", sexo: "Fêmea", porte: "Pequeno", descricao: "Luna é uma gata dócil e curiosa. Perfeita para apartamentos. Ama brincar com laser e dormir no colo. Já foi esterilizada.", foto_url: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80" },
    { id: "test-4", nome: "Maya", idade: "4 anos", sexo: "Fêmea", porte: "Médio", descricao: "Maya tem um coração enorme. Foi resgatada após negligência. Agora saudável e cheia de amor para dar. Procura um lar tranquilo.", foto_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80" },
    { id: "test-5", nome: "Rex", idade: "5 anos", sexo: "Macho", porte: "Grande", descricao: "Rex é fiel e protetor. Adora passeios pela manhã e brincar no parque. Castrado, vacinado e muito carinhoso.", foto_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80" },
    { id: "test-6", nome: "Nina", idade: "8 meses", sexo: "Fêmea", porte: "Pequeno", descricao: "Nina é uma filhotinha cheia de energia! Brinca o dia todo, gosta de bolas e já se dá bem com gatos adultos.", foto_url: "https://images.unsplash.com/photo-1574158622682-e4e8528bce91?auto=format&fit=crop&w=800&q=80" },
];

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
    if (banner) banner.style.display = useTestMode ? "block" : "none";

    if (useTestMode) {
        container.innerHTML = "";
        const animais = MOCK_ANIMALS.slice(0, TEST_COUNT || MOCK_ANIMALS.length);
        if (!animais.length) {
            container.appendChild(mensagemCatalogo("🐕 Nenhum animal disponível no modo de teste."));
            return;
        }
        container.innerHTML = animais.map((animal) => `\n            <article class="animal-card">\n                <span class="ribbon">Disponível</span>\n                <div class="img-wrap">\n                    <img src="${animal.foto_url.startsWith("https://") ? animal.foto_url : ""}" alt="${animal.nome.replace(/"/g,'&quot;')}" loading="lazy">\n                </div>\n                <div class="animal-info">\n                    <h3>${animal.nome.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h3>\n                    <div class="animal-details">\n                        <span class="tag">${animal.idade.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                        <span class="tag">${animal.sexo.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                        <span class="tag">${animal.porte.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>\n                    </div>\n                    <p>${(animal.descricao || "").slice(0,140).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>\n                    <button class="btn btn-details"\n                        data-name="${animal.nome.replace(/"/g,'&quot;')}" data-age="${animal.idade.replace(/"/g,'&quot;')}"\n                        data-sex="${animal.sexo.replace(/"/g,'&quot;')}" data-size="${animal.porte.replace(/"/g,'&quot;')}"\n                        data-description="${(animal.descricao||"").replace(/"/g,'&quot;')}"\n                        data-image="${animal.foto_url.startsWith("https://") ? animal.foto_url : ""}"\n                        data-id="${animal.id.replace(/"/g,'&quot;')}">\n                        Conhecer ${animal.nome.split(" ")[0]}\n                    </button>\n                </div>\n            </article>`).join("");
        return;
    }

    container.innerHTML = "";
    container.appendChild(mensagemCatalogo("Carregando animais... 🐾"));
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
            container.innerHTML = "";
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
            mensagemCatalogo("Não conseguimos carregar os animais agora. 🐾", true, carregarAnimais)
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