# -*- coding: utf-8 -*-
# Gera frontend/index.html a partir do protótipo, integrando Supabase + Edge Function
#
# O protótipo vive versionado em prototipo/adota-patos.html (é a arte original
# entregue pelo Matheus). O caminho é relativo à raiz do repositório, para o
# script funcionar em qualquer máquina — inclusive no CI.
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMINHO_PROTOTIPO = os.path.join(RAIZ, 'prototipo', 'adota-patos.html')
html = open(CAMINHO_PROTOTIPO, encoding='utf-8', newline='').read()

# 1. Substitui TODO o conteudo do grid por UM unico container dinamico
#    (antes usavamos regex.sub() em cada card, o que criava tres copias
#    da div #catalogo-animais: duas ficavam vazias para sempre).
container = '<div id="catalogo-animais"><div class="animal-card" aria-hidden="true"><div class="img-wrap"><div style="height:250px;background:linear-gradient(90deg,#eee,#f5f5f5,#eee)"></div></div><div class="animal-info"></div></div></div>'
inicio_grid = html.index('<div class="animals-grid">')
fim_secao = html.index('</section>', inicio_grid)
novo_grid = '<div class="animals-grid">\n\n                    ' + container + '\n\n                '
html = html[:inicio_grid] + novo_grid + html[fim_secao:]
print('cards fixos substituidos por container unico')

# 2. Delegação de eventos para o modal (funciona com cards criados dinamicamente)
old_modal = '''const animalButtons =
            document.querySelectorAll(".btn-details");


        animalButtons.forEach(button => {

            button.addEventListener("click", () => {'''
new_modal = '''document.addEventListener("click", event => {

            const button = event.target.closest(".btn-details");
            if (!button) return;'''
assert old_modal in html, 'bloco modal nao encontrado'
html = html.replace(old_modal, new_modal)

# 2b. Fecha a delegacao de eventos: o codigo original tinha DOIS niveis
# (forEach + addEventListener); a delegacao usa so um, portanto sobrava
# um "});" orfaos que quebrava todo o script (SyntaxError).
old_fechar = '''                modal.classList.add("active");

            });

        });'''
new_fechar = '''                modal.classList.add("active");

        });'''
assert old_fechar in html, 'fechamento do modal nao encontrado'
html = html.replace(old_fechar, new_fechar)

# 3. Formulário -> Edge Function com feedback humanizado
old_submit = '''adoptionForm.addEventListener("submit", event => {

            event.preventDefault();

            alert(
                "Obrigado pelo seu interesse em adotar! ❤️\\n\\n" +
                "Seu formulário foi preenchido com sucesso."
            );

            adoptionForm.reset();

        });'''
new_submit = '''adoptionForm.addEventListener("submit", async event => {

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
        }'''
assert old_submit in html, 'bloco submit nao encontrado'
html = html.replace(old_submit, new_submit)

# 4. Script de catálogo dinâmico antes do </body>
integracao = '''
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
'''
# 4c. Banner de consentimento de cookies (LGPD) — Google Analytics só carrega após aceite
bloco_banner = '''
        // =========================
        // COOKIES (LGPD): o Google Analytics é estatística de visitas.
        // Por respeito ao visitante (e pela LGPD), ele SÓ entra em cena
        // depois que a pessoa aceita. Quem recusa navega sem analytics.
        // =========================

        const GA_MEASUREMENT_ID = ""; // ← preencher quando a ONG criar a conta do Google Analytics

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
'''

html = html.replace('</body>', '\n        <script>\n' + bloco_banner + '\n        </script>\n    </body>')
# 4. Estilo do catalogo: o grid do prototipo estiliza os FILHOS DIRETOS
#    de .animals-grid; como nossos cards nascem dentro de
#    #catalogo-animais, ele proprio precisa virar o grid responsivo.
estilo_catalogo = '''
        <style>
            /* O catálogo herda o papel de .animals-grid: 3 colunas no
               computador, 2 em telas médias e 1 no celular — igual ao
               comportamento original do protótipo. */
            #catalogo-animais {
                display: grid;
                grid-column: 1 / -1;
                grid-template-columns: repeat(3, 1fr);
                gap: 28px;
            }

            @media (max-width: 900px) {
                #catalogo-animais { grid-template-columns: repeat(2, 1fr); }
            }

            @media (max-width: 650px) {
                #catalogo-animais { grid-template-columns: 1fr; }
            }
        </style>
    </body>'''
html = html.replace('</body>', estilo_catalogo)

html = html.replace('</body>', '\n        <script>\n' + integracao + '\n        </script>\n    </body>')

# 4b. LGPD + anti-spam no formulário (antes do botão de enviar)
bloco_lgpd_form = '''                <!-- LGPD: autorização expressa (art. 7º, I) -->
                    <label style="display:flex;gap:10px;align-items:flex-start;font-size:0.92rem;margin-bottom:14px">
                        <input type="checkbox" id="consentimento-lgpd" required style="margin-top:4px">
                        <span>Autorizo o uso dos meus dados (nome, contato e respostas) para avaliação desta solicitação de adoção.</span>
                    </label>

                    <!-- Resumo de privacidade em linguagem simples -->
                    <details style="font-size:0.88rem;margin-bottom:18px;color:#555">
                        <summary style="cursor:pointer;font-weight:600">Como usamos seus dados?</summary>
                        <p style="margin-top:10px">Coletamos apenas o essencial para avaliar sua candidatura. Quem pode ler são os membros da equipe Adota Patos. Solicitações não aprovadas são apagadas automaticamente após 6 meses. Você pode pedir acesso, correção ou exclusão dos seus dados pelo nosso contato. 🔒</p>
                    </details>

                    <!-- Anti-spam: campo invisível para humanos; robôs preenchem -->
                    <div style="position:absolute;left:-9999px" aria-hidden="true">
                        <label>Site <input type="text" id="website" name="website" tabindex="-1" autocomplete="off"></label>
                    </div>

                    <button type="submit" class="btn">'''
assert '<button type="submit" class="btn">' in html, 'botao submit nao encontrado'
html = html.replace('<button type="submit" class="btn">', bloco_lgpd_form)

# 4b-bis. SEO basico (dicas 5 e 8 da lista do usuario): titulo com a
#         palavra-chave local ("adotar/adocao Patos-PB") + meta description.
_titulo_antigo = '<title>Adota Patos | Encontre um novo amigo</title>'
assert _titulo_antigo in html, 'titulo original mudou no prototipo'
html = html.replace(_titulo_antigo, '''<title>Adota Patos | Adote cães e gatos para adoção em Patos-PB</title>
    <meta name="description" content="Cães e gatos resgatados esperam uma família em Patos-PB. Conheça os animais disponíveis para adoção responsável e faça parte dessa história.">
    <meta property="og:title" content="Adota Patos | Adoção responsável de cães e gatos em Patos-PB">
    <meta property="og:description" content="Veja cães e gatos disponíveis para adoção em Patos-PB e solicite sua adoção online.">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">''')

# 4c. Limites de digitacao nos campos (maxlength), seguindo padroes
#     BRASILEIROS de formulario:
#     - Nome: 80 (padrao da Policia Federal p/ passaporte, gov.br)
#     - Telefone: 15 (formato ANATEL "(83) 99999-9999" = 15 caracteres)
#     - E-mail: 100 (folga sobre e-mails reais; RFC tecnico permite 254)
#     - Cidade: 40 (qualquer municipio brasileiro cabe com folga;
#       padrao de texto curto da PRODABEL-BH usa 30)
#     - Motivo: 300 (PRODABEL-BH: textarea max 300 COM contador regressivo,
#       que implementamos logo abaixo)
for _campo, _maximo in [('name', 80), ('phone', 15), ('email', 100),
                        ('city', 40), ('reason', 300)]:
    _alvo = f'id="{_campo}"'
    assert html.count(_alvo) == 1, f'campo {_campo} nao unico'
    html = html.replace(_alvo, _alvo + f' maxlength="{_maximo}"')
print('maxlength adicionados aos 5 campos')

# Contador visivel de caracteres no campo motivo (ex.: 123/300)
html = html.replace(
    'id="reason" maxlength="300"',
    'id="reason" maxlength="300" oninput="document.getElementById(\'contador-motivo\').textContent = this.value.length + \'/300\'"'
)
assert html.count('</textarea>') == 1, 'esperava um unico textarea'
html = html.replace(
    '</textarea>',
    '</textarea>\n\n                            <div id="contador-motivo" style="font-size:0.8rem;color:#888;text-align:right;margin-top:4px">0/300</div>'
)
print('contador de caracteres do motivo adicionado')

CAMINHO_SAIDA = os.path.join(RAIZ, 'frontend', 'index.html')
open(CAMINHO_SAIDA, 'w', encoding='utf-8', newline='\n').write(html)
print('frontend/index.html gerado:', len(html), 'bytes')
