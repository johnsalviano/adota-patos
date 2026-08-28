

        // =========================
        // MODAL DOS ANIMAIS
        // =========================

        const modal = document.getElementById("animalModal");

        const modalImage =
            document.getElementById("modalImage");

        const modalName =
            document.getElementById("modalName");

        const modalAge =
            document.getElementById("modalAge");

        const modalSex =
            document.getElementById("modalSex");

        const modalSize =
            document.getElementById("modalSize");

        const modalDescription =
            document.getElementById("modalDescription");

        const closeModal =
            document.getElementById("closeModal");


        document.addEventListener("click", event => {

            const button = event.target.closest(".btn-details");
            if (!button) return;

                modalImage.src =
                    button.dataset.image;

                modalImage.alt =
                    button.dataset.name;

                modalName.textContent =
                    button.dataset.name;

                modalAge.textContent =
                    button.dataset.age;

                modalSex.textContent =
                    button.dataset.sex;

                modalSize.textContent =
                    button.dataset.size;

                modalDescription.textContent =
                    button.dataset.description;


                modal.classList.add("active");

        });


        // Fechar modal

        closeModal.addEventListener("click", () => {

            modal.classList.remove("active");

        });


        // Fechar clicando fora

        modal.addEventListener("click", event => {

            if (event.target === modal) {

                modal.classList.remove("active");

            }

        });


        // Botão Quero adotar

        document
            .getElementById("adoptButton")
            .addEventListener("click", () => {

                modal.classList.remove("active");

            });


        // =========================
        // FORMULÁRIO
        // =========================

        const adoptionForm =
            document.getElementById("adoptionForm");


        adoptionForm.addEventListener("submit", async event => {

            event.preventDefault();

            const btn = adoptionForm.querySelector("button[type=submit]") || adoptionForm.querySelector("button");
            const textoOriginal = btn ? btn.textContent : "";
            if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }

            const dados = {
                nome: document.getElementById("name").value.trim(),
                telefone: document.getElementById("phone").value.trim(),
                email: document.getElementById("email").value.trim(),
                cidade: document.getElementById("city").value.trim(),
                experiencia: document.getElementById("experience").value,
                motivo: document.getElementById("reason").value.trim(),
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
                mostrarMensagem(resultado.ok ? "sucesso" : "erro", resultado.mensagem + (resultado.erros ? " " + resultado.erros.join(" ") : ""));
                if (resultado.ok) adoptionForm.reset();
            } catch (e) {
                mostrarMensagem("erro", "Não conseguimos enviar agora. Verifique sua internet e tente novamente.");
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = textoOriginal; }
            }
        });

        function mostrarMensagem(tipo, texto) {
            let area = document.getElementById("form-feedback");
            if (!area) {
                area = document.createElement("div");
                area.id = "form-feedback";
                adoptionForm.prepend(area);
            }
            area.style.cssText = "padding:14px 18px;border-radius:12px;margin-bottom:18px;font-weight:600;" +
                (tipo === "sucesso"
                    ? "background:#e6f9ef;color:#14713d;border:1px solid #9adbb6;"
                    : "background:#fdeaea;color:#a12626;border:1px solid #efb3b3;");
            area.textContent = (tipo === "sucesso" ? "🐶 " : "⚠️ ") + texto;
            area.scrollIntoView({ behavior: "smooth", block: "center" });
        }


        // =========================
        // MENU MOBILE
        // =========================

        const menuMobile =
            document.querySelector(".menu-mobile");

        const navMenu =
            document.querySelector("nav ul");


        menuMobile.addEventListener("click", () => {

            if (
                navMenu.style.display === "flex"
            ) {

                navMenu.style.display = "none";

            } else {

                navMenu.style.display = "flex";

                navMenu.style.position = "absolute";

                navMenu.style.top = "140px";

                navMenu.style.left = "0";

                navMenu.style.width = "100%";

                navMenu.style.padding = "25px";

                navMenu.style.background = "white";

                navMenu.style.flexDirection = "column";

                navMenu.style.textAlign = "center";

            }

        });


        // =========================
        // HEADER COM SOMBRA AO ROLAR
        // =========================

        const siteHeader = document.querySelector("header");

        window.addEventListener("scroll", () => {

            if (window.scrollY > 20) {
                siteHeader.classList.add("scrolled");
            } else {
                siteHeader.classList.remove("scrolled");
            }

        });


        // =========================
        // ANIMAÇÃO AO ROLAR (REVEAL)
        // =========================

        const revealElements = document.querySelectorAll(".reveal");

        const revealObserver = new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("is-visible");

                    revealObserver.unobserve(entry.target);

                }

            });

        }, { threshold: 0.15 });

        revealElements.forEach(el => revealObserver.observe(el));

    



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
            banner.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:9999;" +
                "background:#22293b;color:#fff;padding:16px 20px;display:flex;gap:14px;" +
                "align-items:center;justify-content:center;flex-wrap:wrap;font-size:0.95rem";
            banner.innerHTML =
                '<span>🍪 Usamos cookies apenas para estatísticas anônimas de acesso. ' +
                'Podemos continuar?</span>';
            const botaoAceitar = document.createElement("button");
            botaoAceitar.textContent = "Aceitar";
            botaoAceitar.className = "btn";
            botaoAceitar.style.cssText = "padding:8px 18px";
            const botaoRecusar = document.createElement("button");
            botaoRecusar.textContent = "Recusar";
            botaoRecusar.style.cssText = "padding:8px 18px;background:transparent;color:#fff;" +
                "border:1px solid #8892a8;border-radius:8px;cursor:pointer";
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
        // CATÁLOGO DINÂMICO (Supabase)
        // =========================

        const SUPABASE_URL = "https://fnlqruzbgwffhrqmpfvi.supabase.co";
        const SUPABASE_KEY = "sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR";

        async function carregarAnimais() {
            const container = document.getElementById("catalogo-animais");
            try {
                const resp = await fetch(SUPABASE_URL + "/rest/v1/animais?status=eq.Dispon%C3%ADvel&select=id,nome,idade,sexo,porte,descricao,foto_url&order=created_at.desc", {
                    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }
                });
                if (!resp.ok) throw new Error("HTTP " + resp.status);
                const animais = await resp.json();

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
                    container.innerHTML = '<p style="text-align:center;padding:40px 0;font-size:1.05rem">🐕 No momento todos os nossos amiguinhos já encontraram uma família — volte logo, novos resgates chegam toda semana!</p>';
                    return;
                }

                container.innerHTML = animais.map(a => `
                    <article class="animal-card">
                        <span class="ribbon">Disponível</span>
                        <div class="img-wrap">
                            <img src="${urlDeFotoSegura(a.foto_url)}" alt="${escaparHtml(a.nome)}" loading="lazy">
                        </div>
                        <div class="animal-info">
                            <h3>${escaparHtml(a.nome)}</h3>
                            <div class="animal-details">
                                <span class="tag">${escaparHtml(a.idade)}</span>
                                <span class="tag">${escaparHtml(a.sexo)}</span>
                                <span class="tag">${escaparHtml(a.porte)}</span>
                            </div>
                            <p>${escaparHtml((a.descricao || "").slice(0, 140))}</p>
                            <button class="btn btn-details"
                                data-name="${escaparHtml(a.nome)}" data-age="${escaparHtml(a.idade)}" data-sex="${escaparHtml(a.sexo)}"
                                data-size="${escaparHtml(a.porte)}" data-description="${escaparHtml(a.descricao || "")}"
                                data-image="${urlDeFotoSegura(a.foto_url)}">
                                Conhecer ${escaparHtml(a.nome.split(" ")[0])}
                            </button>
                        </div>
                    </article>`).join("");
            } catch (e) {
                container.innerHTML = '<p style="text-align:center;padding:40px 0;color:#a12626">Não conseguimos carregar os animais agora. Recarregue a página em instantes. 🐾</p>';
            }
        }

        carregarAnimais();

        


        const politicaModal = document.getElementById("politicaModal");

        document.querySelectorAll(".abrir-politica").forEach(botao => {
            botao.addEventListener("click", () => politicaModal.classList.add("active"));
        });

        document.getElementById("fecharPolitica").addEventListener("click", () => {
            politicaModal.classList.remove("active");
        });

        politicaModal.addEventListener("click", event => {
            if (event.target === politicaModal) {
                politicaModal.classList.remove("active");
            }
        });
    
