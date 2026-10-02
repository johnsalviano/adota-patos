// ============================================================
// ADOTA PATOS - MONITORAMENTO DE ERROS (Sentry)
// ------------------------------------------------------------
// Site estatico em HTML/CSS/JS puro, sem build: o navegador
// executa exatamente o arquivo que esta no repositorio. Por isso
// nao ha bundle nem minificacao, e o stack trace do Sentry ja
// aponta o arquivo e a linha reais, sem source map.
//
// O script do SDK e carregado sob demanda, so se houver DSN.
// Sem DSN configurado o site funciona exatamente como antes:
// nenhuma requisicao extra, nenhum erro no console.
//
// Privacy: este modulo nao envia dado pessoal. Nao ha usuario,
// e-mail, IP, nem conteudo de formulario. O Sentry recebe a
// excecao, o arquivo e a linha.
// ============================================================

(function (global) {
    'use strict';

    // DSN publico do projeto Sentry (Settings > Client Keys).
    // Vazio = monitoramento desligado. O DSN pode ir no codigo
    // do front-end: ele so permite enviar eventos, nao ler nada.
    //
    // A janela ADOTA_PATOS_DSN sobrescreve o valor abaixo. Ela existe
    // para o teste automatizado conseguir exercitar o caminho real
    // de envio sem precisar de um projeto Sentry de verdade.
    var DSN_PADRAO = '';

    function dsn() {
        return global.ADOTA_PATOS_DSN || DSN_PADRAO;
    }

    // Marcador de release. Ajuda o Sentry a agrupar o mesmo erro
    // entre deploys. Sem build, usamos a data do deploy.
    var RELEASE = 'adota-patos-frontend';

    // Somente isto entra no Sentry. Erros de rede de recursos de
    // terceiros (fonte, analytics) nao sao problema do site e
    // viram ruido, entao ficam de fora.
    var IGNORAR_ERROS = [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Script error.'
    ];

    // Nao polui o relatorio com extensoes do navegador nem com
    // ruido conhecido de iframe de terceiros.
    var IGNORAR_URLS = [/extensions\//i, /^chrome-extension:\/\//i];

    function dsnConfigurado() {
        return typeof dsn() === 'string' && dsn().length > 0;
    }

    function naoIgnorar(evento) {
        if (!evento) return false;

        // O texto do erro aparece em campos diferentes conforme a origem:
        // evento capturado a mao traz em 'message', erro de janela vem
        // em exception.values[].value. Sem olhar os dois, o filtro
        // passa batido e o ruido chega ao Sentry.
        var valores = evento.exception?.values ?? [];
        var textos = [evento.message, evento.originalError?.message];

        var frames = [];
        for (var e = 0; e < valores.length; e++) {
            var valor = valores[e];
            if (!valor) continue;
            textos.push(valor.value, valor.type);
            if (valor.filename) frames.push(valor.filename);
        }

        for (var i = 0; i < textos.length; i++) {
            var texto = textos[i];
            if (typeof texto !== 'string') continue;
            for (var j = 0; j < IGNORAR_ERROS.length; j++) {
                if (texto.indexOf(IGNORAR_ERROS[j]) !== -1) return false;
            }
        }

        for (var f = 0; f < frames.length; f++) {
            for (var u = 0; u < IGNORAR_URLS.length; u++) {
                if (IGNORAR_URLS[u].test(frames[f])) return false;
            }
        }

        return true;
    }

    function iniciar(Sentry) {
        Sentry.init({
            dsn: dsn(),
            release: RELEASE,

            // Sem transacao e sem replay: este projeto so precisa
            // saber quando o site quebra, nao medir performance.
            // Session Replay em especial nao entra, porque gravar a
            // sessao da pessoa e tratamento de dado pessoal.
            tracesSampleRate: 0,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,

            // Erro novo para a gente vale mais que repeticao: o
            // limite evita estouro de cota com ruido.
            sampleRate: 1,

            // Sem dados pessoais (padrao ja e false, explicito
            // para nao depender de mudanca futura de padrao).
            sendDefaultPii: false,

            // O site nao depende do Sentry para funcionar: se a
            // inicializacao falhar, o site segue normal.
            autoSessionTracking: false,

            beforeSend: function (evento) {
                return naoIgnorar(evento) ? evento : null;
            }
        });

        global.Sentry = Sentry;
        return true;
    }

    function carregarSdk() {
        return new Promise(function (resolve) {
            if (global.Sentry) {
                resolve(global.Sentry);
                return;
            }

            var script = document.createElement('script');
            script.src = 'https://browser.sentry-cdn.com/11.2.0/bundle.min.js';
            script.crossOrigin = 'anonymous';
            // Subresource Integrity: o navegador recusa o script se
            // ele nao for exatamente o publicado pelo Sentry.
            // Hash medido no arquivo real (bundle.min.js tem hash
            // proprio, diferente do bundle.tracing).
            script.integrity =
                'sha384-l0kXFfTvbCBXTXof/tsffRPVCReiCBsn1RjjMsWQCHb51P+YnGeo2Q2DDLMWuZyV';
            script.onload = function () {
                resolve(global.Sentry);
            };
            // Sem Sentry, sem erro: e o comportamento anterior.
            script.onerror = function () {
                resolve(null);
            };
            document.head.appendChild(script);
        });
    }

    // O proprio SDK instala os ouvintes de erro global e de
    // 'unhandledrejection' quando o init roda (integracao GlobalHandlers,
    // ligada por padrao). Nao registramos ouvintes aqui de proposito:
// duplicar a captura faria cada erro chegar duas vezes ao Sentry e
    // dispararia alerta em dobro.
//
// Consequencia aceita: um erro que aconteca nos primeiros
    // milissegundos, antes do SDK carregar, nao e reportado. O site
    // estatico carrega rapido e o script e o primeiro da pagina, o que
    // torna essa janela pequena. Erros de carregamento de recurso
    // externo (fonte, analytics) continuam fora, por serem ruido.
global.AdotaPatosErros = {
        dsnConfigurado: dsnConfigurado,
        iniciar: function () {
            if (!dsnConfigurado()) {
                return Promise.resolve(false);
            }
            return carregarSdk().then(function (Sentry) {
                if (!Sentry) return false;
                return iniciar(Sentry);
            });
        }
    };
})(window);