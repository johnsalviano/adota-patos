// Mesmas credenciais publicas do site: seguranca real vem da RLS e do Supabase Auth
const cliente = window.supabase.createClient(
    'https://fnlqruzbgwffhrqmpfvi.supabase.co',
    'sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR'
);

const form = document.getElementById('formulario-login');
const erro = document.getElementById('mensagem-erro');
const botao = document.getElementById('botao-entrar');

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
