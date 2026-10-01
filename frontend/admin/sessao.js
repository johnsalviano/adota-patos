// Escolha do local de persistencia da sessao, controlada pelo campo
// "Lembrar-me" do login.
//
// Aqui nao existe token, cookie nem senha: a sessao continua sendo
// creada, renovada e destruida pela propria biblioteca do Supabase Auth.
// Este modulo apenas escolhe, de forma oficial via createClient
// (auth.storage), em qual Storage do navegador a biblioteca guarda a
// sessao:
//
//   marcado     -> localStorage   : sobrevive ao fechamento do navegador
//   desmarcado  -> sessionStorage : sobrevive a reload e a navegacao entre
//                                    paginas, mas some ao fechar a aba
//
// A opcao auth.persistSession:false foi descartada de proposito: ela
// joga a sessao so na memoria, e como o site abre painel.html em outra
// pagina, o usuario seria deslogado logo apos entrar.
(function (global) {
    'use strict';

    var SUPABASE_URL = 'https://fnlqruzbgwffhrqmpfvi.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR';

    // Marcador de preferencia (nao e credencial): "0" significa sessao
    // temporaria. Vive no sessionStorage, que e justamente o storage que
    // se descarta ao fechar a aba, entao a preferencia acompanha a sessao
    // temporaria sem sobreviver a ela.
    var CHAVE_PREFERENCIA = 'adota-patos:lembrar-me';

    // A chave real da sessao ("sb-<projeto>-auth-token") e da propria
    // biblioteca e chega como argumento em cada chamada, por isso nao
    // precisa ser conhecida aqui.
    function criarArmazenamento(lembrar) {
        var destino = lembrar ? global.localStorage : global.sessionStorage;

        return {
            getItem: function (chave) {
                // Le dos dois storages: o painel pode ser aberto direto pela
                // URL, em outra aba, e nesse caso a sessao valida precisa
                // ser encontrada mesmo que a preferencia nao tenha vindo
                // junto. A temporaria tem prioridade por ser mais restrita.
                var temporaria = global.sessionStorage.getItem(chave);
                if (temporaria !== null) return temporaria;
                return global.localStorage.getItem(chave);
            },
            setItem: function (chave, valor) {
                destino.setItem(chave, valor);
            },
            removeItem: function (chave) {
                // O logout remove dos dois: nao pode sobrar sessao em um
                // storage que a proxima visita do painel ainda encontraria.
                global.sessionStorage.removeItem(chave);
                global.localStorage.removeItem(chave);
            }
        };
    }

    // Lembrar marcado e o padrao: enquanto a preferencia nao foi registrada
    // como temporaria, vale a persistencia entre visitas.
    function lerPreferencia() {
        return global.sessionStorage.getItem(CHAVE_PREFERENCIA) !== '0';
    }

    function criarCliente(lembrar) {
        var usarPersistencia = typeof lembrar === 'boolean' ? lembrar : lerPreferencia();

        if (!usarPersistencia) {
            global.sessionStorage.setItem(CHAVE_PREFERENCIA, '0');
        } else {
            global.sessionStorage.removeItem(CHAVE_PREFERENCIA);
        }

        return global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                storage: criarArmazenamento(usarPersistencia),
                persistSession: true,
                autoRefreshToken: true
            }
        });
    }

    global.SessaoPatos = {
        criarCliente: criarCliente,
        lerPreferencia: lerPreferencia
    };
})(window);
