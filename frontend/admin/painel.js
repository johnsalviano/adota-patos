(function () {
    'use strict';

    // Le a preferencia de "Lembrar-me" deixada no login: assim uma sessao
    // temporaria continua valendo no painel.html (que e outra pagina) e nao
    // e promovida a persistente. Sem preferencia registrada, o padrao e
    // persistir, como sempre foi.
    var cliente = window.SessaoPatos.criarCliente();

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
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            carregarSolicitacoes();
        } else if (aba === 'animais') {
            btns[1].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.remove('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            carregarAnimais();
        } else {
            btns[2].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
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

        // O texto de identificacao vem da funcao meu_username(), que le o
        // username do proprio perfil a partir do id da sessao (auth.uid()).
        // Nao usamos session.user.email: ele traria o identificador interno
        // do Auth em vez do nome de login. E nao usamos o campo do formulario:
        // quem escreve ali e o usuario, nao o servidor.
        var usernameResp = await cliente.rpc('meu_username');
        var username = usernameResp.data || '';

        document.getElementById('usuario-logado').textContent = username;
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

        container.textContent = '';

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
            ['Experiência', item.experiencia],
            ['Motivo', item.motivo]
        ];
        if (item.animal_id) {
            var nomeAnimal = mapaAnimais[item.animal_id];
            dados.push(['Animal', nomeAnimal ? nomeAnimal : item.animal_id]);
        }
        dados.push(['Solicitada em', item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : null]);
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

        // Campos obrigatorios do produto, na ordem em que aparecem no form.
        // Espelham o NOT NULL do banco e os atributos required do HTML. Como o
        // form tem novalidate, esta lista e o unico lugar que bloqueia o envio
        // de verdade; sem ela o campo vazio chegava direto no insert.
        var obrigatorios = [
            ['nome', 'Informe o nome do animal.'],
            ['especie', 'Selecione a espécie.'],
            ['idade', 'Informe a idade do animal.'],
            ['sexo', 'Selecione o sexo.'],
            ['porte', 'Selecione o porte.'],
            ['descricao', 'Descreva a história do animal.']
        ];

        for (var i = 0; i < obrigatorios.length; i++) {
            var campo = document.getElementById(obrigatorios[i][0]);
            if (campo.value.trim() === '') {
                mostrarFeedback(obrigatorios[i][1], true);
                campo.focus();
                return;
            }
        }

        if (!foto.files || foto.files.length === 0) {
            mostrarFeedback('Selecione uma foto para o animal.', true);
            return;
        }

        var arquivoFoto = foto.files[0];
        if (arquivoFoto.size > TAMANHO_MAX_FOTO) {
            mostrarFeedback('A foto deve ter no máximo 5MB.', true);
            return;
        }

        // O tipo real vem do MIME do arquivo, nunca do nome enviado.
        // Sem isso um "foto.exe" viraria "animais/<uuid>.exe" no bucket.
        // A regra que barra de verdade e a Migration 007
        // (allowed_mime_types + file_size_limit no bucket); aqui o
        // objetivo e dar mensagem clara em vez de erro cru do storage.
        var EXTENSAO_POR_MIME = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };
        if (!EXTENSAO_POR_MIME[arquivoFoto.type]) {
            mostrarFeedback('Formato não aceito. Use JPG, PNG ou WebP.', true);
            return;
        }

        var msgStatus = document.getElementById('msg-status');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando foto e salvando...';
        mostrarFeedback('', false);

        try {
            var extensao = EXTENSAO_POR_MIME[arquivoFoto.type];
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
                idade: document.getElementById('idade').value.trim(),
                sexo: document.getElementById('sexo').value,
                porte: document.getElementById('porte').value,
                descricao: document.getElementById('descricao').value.trim(),
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

    document.getElementById('aba-animais').addEventListener('click', function () {
        mudarAba('animais');
    });

    document.getElementById('aba-cadastrar').addEventListener('click', function () {
        mudarAba('cadastrar');
    });


    // ---------------- Animais ----------------
    async function carregarAnimais() {
        var container = document.getElementById('lista-animais');
        container.textContent = '';
        var p = document.createElement('p');
        p.className = 'carregando';
        p.textContent = 'Carregando animais...';
        container.appendChild(p);

        var resp = await cliente
            .from('animais')
            .select('*')
            .order('created_at', { ascending: false });

        if (resp.error) {
            container.textContent = '';
            var msg = document.createElement('p');
            msg.textContent = 'Erro ao carregar animais: ' + resp.error.message;
            container.appendChild(msg);
            return;
        }

        if (!resp.data || resp.data.length === 0) {
            container.textContent = '';
            var vazio = document.createElement('p');
            vazio.className = 'vazio';
            vazio.textContent = 'Nenhum animal cadastrado.';
            container.appendChild(vazio);
            return;
        }

        container.textContent = '';
        resp.data.forEach(function (animal) {
            var card = document.createElement('div');
            card.className = 'animal-card';

            var header = document.createElement('div');
            header.className = 'animal-header';
            var nome = document.createElement('strong');
            nome.textContent = animal.nome;
            var badge = document.createElement('span');
            badge.className = 'badge-status badge-' + (animal.status === 'Adotado' ? 'Aprovada' : 'Pendente');
            badge.textContent = animal.status || 'Disponível';
            header.appendChild(nome);
            header.appendChild(badge);
            card.appendChild(header);

            var corpo = document.createElement('div');
            corpo.className = 'solicitacao-corpo';
            var dados = [
                ['Espécie', animal.especie],
                ['Raça', animal.raca || 'Não informado'],
                ['Idade', animal.idade],
                ['Sexo', animal.sexo],
                ['Porte', animal.porte],
                ['Descrição', animal.descricao],
                ['Status', animal.status]
            ];
            dados.forEach(function (par) {
                var linha = document.createElement('p');
                var rotulo = document.createElement('strong');
                rotulo.textContent = par[0] + ': ';
                linha.appendChild(rotulo);
                linha.appendChild(document.createTextNode(par[1] || 'Não informado'));
                corpo.appendChild(linha);
            });
            card.appendChild(corpo);

            var acoes = document.createElement('div');
            acoes.className = 'solicitacao-acoes';

            var btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn-editar';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', function () {
                editarAnimal(animal.id);
            });

            var btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'btn-recusar';
            btnExcluir.textContent = 'Excluir';
            btnExcluir.addEventListener('click', function () {
                if (confirm('Tem certeza que deseja excluir o animal ' + animal.nome + '?')) {
                    excluirAnimal(animal.id);
                }
            });

            var btnAdotado = document.createElement('button');
            btnAdotado.type = 'button';
            btnAdotado.className = 'btn-aprovar';
            btnAdotado.textContent = 'Marcar como Adotado';
            btnAdotado.addEventListener('click', function () {
                if (animal.status === 'Disponível') {
                    marcarAdotado(animal.id);
                } else {
                    window.alert('Este animal já está marcado como Adotado.');
                }
            });

            acoes.appendChild(btnEditar);
            acoes.appendChild(btnExcluir);
            acoes.appendChild(btnAdotado);
            card.appendChild(acoes);

            container.appendChild(card);
        });
    }

    async function editarAnimal(id) {
        var resp = await cliente
            .from('animais')
            .select('nome, especie, idade, porte, descricao, status')
            .eq('id', id)
            .single();
        if (resp.error || !resp.data) {
            window.alert('Erro ao carregar animal: ' + (resp.error ? resp.error.message : 'não encontrado'));
            return;
        }
        var animal = resp.data;
        var novoNome = prompt('Novo nome do animal:', animal.nome);
        if (novoNome === null || novoNome.trim() === '') return;
        var novaEspecie = prompt('Nova espécie (' + animal.especie + '):', animal.especie);
        if (novaEspecie === null) return;
        var novaIdade = prompt('Nova idade (' + animal.idade + '):', animal.idade);
        if (novaIdade === null) return;
        var novoPorte = prompt('Novo porte (' + animal.porte + '):', animal.porte);
        if (novoPorte === null) return;
        var novaDescricao = prompt('Nova descrição:', animal.descricao);
        if (novaDescricao === null) return;
        var novoStatus = prompt('Novo status (Disponível / Adotado):', animal.status);
        if (novoStatus === null) return;
        if (novoStatus !== 'Disponível' && novoStatus !== 'Adotado') {
            window.alert('Status inválido. Use Disponível ou Adotado.');
            return;
        }
        var updateResp = await cliente
            .from('animais')
            .update({
                nome: novoNome.trim(),
                especie: novaEspecie.trim(),
                idade: novaIdade.trim(),
                porte: novoPorte.trim(),
                descricao: novaDescricao.trim(),
                status: novoStatus
            })
            .eq('id', id);
        if (updateResp.error) {
            window.alert('Erro ao editar animal: ' + updateResp.error.message);
        } else {
            carregarAnimais();
        }
    }

    async function excluirAnimal(id) {
        var resp = await cliente
            .from('animais')
            .delete()
            .eq('id', id);
        if (resp.error) {
            window.alert('Erro ao excluir animal: ' + resp.error.message);
        } else {
            carregarAnimais();
        }
    }

    async function marcarAdotado(id) {
        var resp = await cliente
            .from('animais')
            .update({ status: 'Adotado' })
            .eq('id', id);
        if (resp.error) {
            window.alert('Erro ao marcar animal como Adotado: ' + resp.error.message);
        } else {
            carregarAnimais();
        }
    }

    verificarAcesso();
})();