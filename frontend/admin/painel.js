(function () {
    'use strict';

    var SUPABASE_URL = 'https://fnlqruzbgwffhrqmpfvi.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR';
    var cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    var TAMANHO_MAX_FOTO = 5 * 1024 * 1024;

    function badgeStatus(status) {
        var mapa = {
            'Pendente': 'Pendente',
            'Em análise': 'Em-analise',
            'Aprovada': 'Aprovada',
            'Aprovado': 'Aprovada',
            'Recusada': 'Recusada',
            'Recusado': 'Recusada',
            'Rejeitada': 'Recusada'
        };
        var chave = status || '';
        return mapa[chave] || 'Pendente';
    }

    function podeAvaliar(status) {
        return status === 'Pendente' || status === 'Em análise';
    }

    function mostrarFeedback(msg, ehErro) {
        var caixa = document.getElementById('msg-status');
        caixa.textContent = '';
        caixa.classList.remove('sucesso', 'erro');
        if (!msg) return;
        caixa.textContent = msg;
        caixa.classList.add(ehErro ? 'erro' : 'sucesso');
    }

    // ---------------- Abas ----------------
    function mudarAba(aba) {
        var btns = document.querySelectorAll('.aba-btn');
        btns.forEach(function (b) { b.classList.remove('ativa'); });
        if (aba === 'solicitacoes') {
            btns[0].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.remove('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            carregarSolicitacoes();
        } else {
            btns[1].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.remove('oculto');
        }
    }

    // ---------------- Acesso ----------------
    async function verificarAcesso() {
        var sessionResp = await cliente.auth.getSession();
        var session = sessionResp.data.session;

        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        var rpcResp = await cliente.rpc('eh_membro_ong');
        if (rpcResp.error || !rpcResp.data) {
            await cliente.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('email-logado').textContent = session.user.email || '';
        document.getElementById('tela-carregando').classList.add('oculto');
        document.getElementById('conteudo-painel').classList.remove('oculto');

        carregarSolicitacoes();
    }

    // ---------------- Solicitações ----------------
    async function carregarSolicitacoes() {
        var container = document.getElementById('lista-solicitacoes');
        container.textContent = '';
        var p = document.createElement('p');
        p.className = 'carregando';
        p.textContent = 'Carregando solicitações...';
        container.appendChild(p);

        var resp = await cliente
            .from('adocoes')
            .select('*')
            .order('created_at', { ascending: false });

        if (resp.error) {
            container.textContent = '';
            var msg = document.createElement('p');
            msg.textContent = 'Erro ao carregar solicitações: ' + resp.error.message;
            container.appendChild(msg);
            return;
        }

        if (!resp.data || resp.data.length === 0) {
            container.textContent = '';
            var vazio = document.createElement('p');
            vazio.className = 'vazio';
            vazio.textContent = 'Nenhuma solicitação de adoção encontrada.';
            container.appendChild(vazio);
            return;
        }

        var idsAnimais = (resp.data
            .map(function (a) { return a.animal_id; })
            .filter(Boolean)).join(',');

        var mapaAnimais = {};
        if (idsAnimais) {
            var animaisResp = await cliente
                .from('animais')
                .select('id, nome')
                .in('id', idsAnimais.split(','));
            if (!animaisResp.error && animaisResp.data) {
                animaisResp.data.forEach(function (animal) {
                    mapaAnimais[animal.id] = animal.nome;
                });
            }
        }

        resp.data.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'solicitacao-card';

            var header = document.createElement('div');
            header.className = 'solicitacao-header';
            var nomeAdotante = document.createElement('strong');
            nomeAdotante.textContent = 'Adotante: ' + item.nome;
            var badge = document.createElement('span');
            badge.className = 'badge-status badge-' + badgeStatus(item.status);
            badge.textContent = item.status;
            header.appendChild(nomeAdotante);
            header.appendChild(badge);
            card.appendChild(header);

            var corpo = document.createElement('div');
            corpo.className = 'solicitacao-corpo';
            var dados = [
                ['E-mail', item.email],
                ['Telefone', item.telefone],
                ['Cidade', item.cidade],
                ['Motivo', item.motivo]
            ];
            if (item.animal_id) {
                var nomeAnimal = mapaAnimais[item.animal_id];
                dados.push(['Animal', nomeAnimal ? nomeAnimal : item.animal_id]);
            }
            dados.forEach(function (par) {
                var linha = document.createElement('p');
                var rotulo = document.createElement('strong');
                rotulo.textContent = par[0] + ': ';
                linha.appendChild(rotulo);
                linha.appendChild(document.createTextNode(par[1] || 'Não informado'));
                corpo.appendChild(linha);
            });
            card.appendChild(corpo);

            if (podeAvaliar(item.status)) {
                var acoes = document.createElement('div');
                acoes.className = 'solicitacao-acoes';

                var btnAprovar = document.createElement('button');
                btnAprovar.type = 'button';
                btnAprovar.className = 'btn-aprovar';
                btnAprovar.textContent = 'Aprovar';
                btnAprovar.addEventListener('click', function () {
                    atualizarStatus(item.id, 'Aprovada');
                });

                var btnRecusar = document.createElement('button');
                btnRecusar.type = 'button';
                btnRecusar.className = 'btn-recusar';
                btnRecusar.textContent = 'Recusar';
                btnRecusar.addEventListener('click', function () {
                    atualizarStatus(item.id, 'Recusada');
                });

                acoes.appendChild(btnAprovar);
                acoes.appendChild(btnRecusar);
                card.appendChild(acoes);
            }

            container.appendChild(card);
        });
    }

    async function atualizarStatus(idSolicitacao, novoStatus) {
        var resp = await cliente
            .from('adocoes')
            .update({ status: novoStatus })
            .eq('id', idSolicitacao);

        if (resp.error) {
            window.alert('Erro ao atualizar status: ' + resp.error.message);
        } else {
            carregarSolicitacoes();
        }
    }

    // ---------------- Cadastro ----------------
    document.getElementById('form-cadastrar-animal').addEventListener('submit', async function (e) {
        e.preventDefault();

        var btnSubmit = document.getElementById('btn-salvar-animal');
        var foto = document.getElementById('foto');

        if (!foto.files || foto.files.length === 0) {
            mostrarFeedback('Selecione uma foto para o animal.', true);
            return;
        }

        var arquivoFoto = foto.files[0];
        if (arquivoFoto.size > TAMANHO_MAX_FOTO) {
            mostrarFeedback('A foto deve ter no máximo 5MB.', true);
            return;
        }

        var msgStatus = document.getElementById('msg-status');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando foto e salvando...';
        mostrarFeedback('', false);

        try {
            var extensao = arquivoFoto.name.split('.').pop() || 'jpg';
            var caminhoFoto = 'animais/' + crypto.randomUUID() + '.' + extensao;

            var upload = await cliente.storage
                .from('fotos-animais')
                .upload(caminhoFoto, arquivoFoto);

            if (upload.error) throw upload.error;

            var urlData = cliente.storage
                .from('fotos-animais')
                .getPublicUrl(caminhoFoto);

            var dadosAnimal = {
                nome: document.getElementById('nome').value.trim(),
                especie: document.getElementById('especie').value,
                raca: document.getElementById('raca').value.trim() || null,
                idade: document.getElementById('idade').value.trim() || null,
                sexo: document.getElementById('sexo').value,
                porte: document.getElementById('porte').value,
                descricao: document.getElementById('descricao').value.trim() || null,
                foto_url: urlData.data.publicUrl,
                status: 'Disponível'
            };

            var dbResp = await cliente.from('animais').insert(dadosAnimal);
            if (dbResp.error) throw dbResp.error;

            document.getElementById('form-cadastrar-animal').reset();
            mostrarFeedback('Animal cadastrado com sucesso!', false);
        } catch (err) {
            console.error(err);
            mostrarFeedback('Erro ao cadastrar animal: ' + err.message, true);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Salvar Animal';
        }
    });

    // ---------------- Sair ----------------
    document.getElementById('botao-sair').addEventListener('click', async function () {
        await cliente.auth.signOut();
        window.location.href = 'login.html';
    });

    cliente.auth.onAuthStateChange(function (evento) {
        if (evento === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });

    document.getElementById('aba-solicitacoes').addEventListener('click', function () {
        mudarAba('solicitacoes');
    });

    document.getElementById('aba-cadastrar').addEventListener('click', function () {
        mudarAba('cadastrar');
    });

    verificarAcesso();
})();