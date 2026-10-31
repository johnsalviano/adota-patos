// Monitoramento de erros. Sem DSN no projeto Sentry, esta chamada
// resolve false e nada acontece. Ver frontend/js/erros.js.
if (window.AdotaPatosErros) {
    window.AdotaPatosErros.iniciar();
}

// Mesmas credenciais publicas do site: seguranca real vem da RLS e do Supabase Auth
const form = document.getElementById('formulario-login');
const erro = document.getElementById('mensagem-erro');
const botao = document.getElementById('botao-entrar');
const lembrarMe = document.getElementById('lembrar-me');
const campoUsername = document.getElementById('username');

// Sincroniza o checkbox com a preferencia salva (se houver), para que o
// "Lembrar-me" reflita a escolha anterior ao voltar para a tela de login.
// A preferencia padrao e "lembrar" (true), entao o checkbox aparece marcado
// a menos que a pessoa tenha escolhido explicitamente o modo temporario
// nesta mesma sessao de navegador.
if (window.SessaoPatos && typeof window.SessaoPatos.lerPreferencia === 'function') {
    lembrarMe.checked = window.SessaoPatos.lerPreferencia();
}

// Lembra o usuario e a senha quando "Lembrar-me" foi marcado em um
// login anterior, para que a pessoa nao precise digitar novamente.
// (Pedido explicito do responsavel: maquina propria, sem compartilhamento.)
const CHAVE_CREDENCIAIS = 'adota-patos:credenciais';
var credenciaisCarregadas = false;
try {
    var credenciaisSalvas = localStorage.getItem(CHAVE_CREDENCIAIS);
    if (credenciaisSalvas) {
        var cred = JSON.parse(credenciaisSalvas);
        if (cred && cred.u && campoUsername && !campoUsername.value) {
            campoUsername.value = cred.u;
        }
        if (cred && cred.p) {
            var campoSenhaEl = document.getElementById('senha');
            if (campoSenhaEl && !campoSenhaEl.value) {
                campoSenhaEl.value = cred.p;
            }
        }
        if (lembrarMe) lembrarMe.checked = true;
        credenciaisCarregadas = true;
    }
} catch (e) { /* storage indisponivel ou JSON invalido: segue sem preencher */ }

// Se as credenciais foram carregadas do "Lembrar-me", entra automaticamente
// sem exigir clique, para que a pessoa nao precise digitar nada.
if (credenciaisCarregadas && form) {
    setTimeout(function () {
        // So auto-submete se ainda estiver na tela de login (nao foi
        // redirecionado para o painel por sessao persistente).
        if (!location.href.includes('login.html')) return;
        if (document.getElementById('username').value && document.getElementById('senha').value) {
            form.requestSubmit();
        }
    }, 300);
}

// O cliente nasce no envio, e nao no carregamento da pagina: o storage que
// define a persistencia so pode ser escolhido depois que a pessoa decidiu o
// que quer com o "Lembrar-me". Ver sessao.js.
let cliente = null;

// (Removido: botao "ver senha" — decisao de seguranca do responsavel.
//  Auto-preenchimento de credenciais pelo "Lembrar-me" dispensa a conferencia
//  manual da senha, e o botao poderia expor a senha em maquina compartilhada.)

// Se ja existe sessao persistida (Lembrar-me anterior), entra direto no
// painel sem pedir login de novo. Isso faz o "Lembrar-me" funcionar como
// esperado: a conta permanece logada entre visitas.
(async function verificarSessaoExistente() {
    try {
        var clienteExistente = window.SessaoPatos.criarCliente();
        var resp = await clienteExistente.auth.getSession();
        if (resp && resp.data && resp.data.session) {
            window.location.replace('painel.html');
        }
    } catch (e) {
        // Silencioso: se falhar, segue no login normal.
    }
})();

function mostrarErro(texto) {
    erro.textContent = texto;
    erro.classList.add('visivel');
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erro.classList.remove('visivel');

    const username = document.getElementById('username').value.trim();
    const senha = document.getElementById('senha').value;

    botao.disabled = true;
    botao.textContent = 'Verificando...';

    try {
        // 0. Persistencia conforme a escolha: marcado guarda a sessao no
        // localStorage (sobrevive ao navegador fechado), desmarcado guarda no
        // sessionStorage (some ao fechar a aba). A senha nunca e guardada e o
        // storage e uma opcao oficial do Supabase Auth, nao um token nosso.
        cliente = window.SessaoPatos.criarCliente(lembrarMe.checked);

        // 1. Login via Edge Function (preserva Supabase Auth, nao expoe email)
        const resposta = await fetch(
            'https://fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/login-username',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: senha }),
            }
        );

        const resultado = await resposta.json();

        if (!resultado.ok) {
            mostrarErro(resultado.mensagem || 'Login ou senha incorretos. Confira e tente novamente.');
            return;
        }

        // 2. Configura sessao com tokens retornados pela Edge Function
        // (o destino do storage ja foi definido no passo 0)
        const { error: erroSessao } = await cliente.auth.setSession({
            access_token: resultado.access_token,
            refresh_token: resultado.refresh_token,
        });

        if (erroSessao) {
            mostrarErro('Nao foi possivel configurar a sessao. Tente novamente.');
            return;
        }

        // 3. Verifica se o usuario esta autorizado pela ONG (RLS)
        const { data: membro, error: erroMembro } = await cliente.rpc('eh_membro_ong');

        if (erroMembro || !membro) {
            await cliente.auth.signOut();
            mostrarErro('Esta conta nao tem permissao de acesso a equipe.');
            return;
        }

        // 4. Membro confirmado: lembra as credenciais (se pediu) e segue para o painel
        if (lembrarMe.checked) {
            try { localStorage.setItem(CHAVE_CREDENCIAIS, JSON.stringify({ u: username, p: senha })); } catch (e) { /* ignora */ }
        } else {
            try { localStorage.removeItem(CHAVE_CREDENCIAIS); } catch (e) { /* ignora */ }
        }
        window.location.href = 'painel.html';

    } catch (falha) {
        mostrarErro('Nao foi possivel conectar agora. Tente novamente em instantes.');
    } finally {
        botao.disabled = false;
        botao.textContent = 'Entrar';
    }
});
