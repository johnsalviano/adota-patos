// Mesmas credenciais publicas do site: seguranca real vem da RLS
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

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    botao.disabled = true;
    botao.textContent = 'Verificando...';

    try {
        // 1. Autentica com e-mail e senha
        const { data, error } = await cliente.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) {
            mostrarErro('E-mail ou senha incorretos. Confira e tente novamente.');
            return;
        }

        // 2. So entra quem esta na lista autorizada da ONG
        const { data: membro, error: erroMembro } = await cliente
            .rpc('eh_membro_ong');

        if (erroMembro || !membro) {
            // Conta existe, mas nao foi autorizada pela ONG:
            // encerra a sessao imediatamente.
            await cliente.auth.signOut();
            mostrarErro('Esta conta não tem permissão de acesso à equipe.');
            return;
        }

        // 3. Membro confirmado: segue para o painel
        window.location.href = 'painel.html';

    } catch (falha) {
        mostrarErro('Não foi possível conectar agora. Tente novamente em instantes.');
    } finally {
        botao.disabled = false;
        botao.textContent = 'Entrar';
    }
});