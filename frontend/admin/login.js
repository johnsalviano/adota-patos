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

// O cliente nasce no envio, e nao no carregamento da pagina: o storage que
// define a persistencia so pode ser escolhido depois que a pessoa decidiu o
// que quer com o "Lembrar-me". Ver sessao.js.
let cliente = null;

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

        // 4. Membro confirmado: segue para o painel
        window.location.href = 'painel.html';

    } catch (falha) {
        mostrarErro('Nao foi possivel conectar agora. Tente novamente em instantes.');
    } finally {
        botao.disabled = false;
        botao.textContent = 'Entrar';
    }
});
