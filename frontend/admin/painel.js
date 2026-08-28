const cliente = window.supabase.createClient(
    'https://fnlqruzbgwffhrqmpfvi.supabase.co',
    'sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR'
);

// Guarda dupla: precisa ter sessao E ser membro autorizado.
async function verificarAcesso() {
    const { data: { session } } = await cliente.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: membro } = await cliente.rpc('eh_membro_ong');

    if (!membro) {
        await cliente.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('email-logado').textContent =
        escaparTexto(session.user.email || '');
    document.getElementById('tela-carregando').classList.add('oculto');
    document.getElementById('conteudo-painel').classList.remove('oculto');
}

function escaparTexto(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.textContent;
}

document.getElementById('botao-sair').addEventListener('click', async () => {
    await cliente.auth.signOut();
    window.location.href = 'login.html';
});

// Se a sessao expirar enquanto navega, volta pro login.
cliente.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT') window.location.href = 'login.html';
});

verificarAcesso();