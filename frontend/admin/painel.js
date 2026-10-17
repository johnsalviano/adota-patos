(function () {
    'use strict';

    // Monitoramento de erros. Sem DSN no projeto Sentry, esta chamada
    // resolve false e nada acontece. Ver frontend/js/erros.js.
    if (window.AdotaPatosErros) {
        window.AdotaPatosErros.iniciar();
    }

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
        btns.forEach(function (b) {
            b.classList.remove('ativa');
            b.setAttribute('aria-selected', 'false');
        });
        if (aba === 'solicitacoes') {
            btns[0].classList.add('ativa');
            btns[0].setAttribute('aria-selected', 'true');
            document.getElementById('secao-solicitacoes').classList.remove('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
            carregarSolicitacoes();
        } else if (aba === 'animais') {
            btns[1].classList.add('ativa');
            btns[1].setAttribute('aria-selected', 'true');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.remove('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
            carregarAnimais();
        } else if (aba === 'cadastrar') {
            btns[2].classList.add('ativa');
            btns[2].setAttribute('aria-selected', 'true');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.remove('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
        } else if (aba === 'transparencia') {
            btns[3].classList.add('ativa');
            btns[3].setAttribute('aria-selected', 'true');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            document.getElementById('secao-transparencia').classList.remove('oculto');
            carregarTransparenciaAdmin();
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
        carregarTransparenciaAdmin();
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

            // Filtrar: não mostrar solicitações recusadas na lista operacional
            var solicitacoesOperacionais = (resp.data || []).filter(function (item) {
                return item.status !== 'Recusada';
            });

            if (!solicitacoesOperacionais || solicitacoesOperacionais.length === 0) {
                container.textContent = '';
                var vazio = document.createElement('p');
                vazio.className = 'vazio';
                vazio.textContent = 'Nenhuma solicitação de adoção pendente ou em análise.';
                container.appendChild(vazio);
                return;
            }

            var idsAnimais = (solicitacoesOperacionais
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

            solicitacoesOperacionais.forEach(function (item) {
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
                        if (confirm('Tem certeza que deseja recusar esta solicitação? Ela será removida da lista operacional.')) {
                            atualizarStatus(item.id, 'Recusada');
                        }
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
            ['descricao', 'Descreva a história do animal.'],
            ['pelagem', 'Selecione a pelagem.']
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
                pelagem: document.getElementById('pelagem').value,
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

    document.getElementById('aba-transparencia').addEventListener('click', function () {
        mudarAba('transparencia');
    });

    // ---------------- Verificar se é gerente de transparência ----------------
    async function verificarGerenteTransparencia() {
        try {
            var resp = await cliente.rpc('eh_gerente_transparencia');
            return resp.data === true;
        } catch (err) {
            console.error('Erro ao verificar gerente:', err);
            return false;
        }
    }


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
                    card.dataset.animalId = animal.id;

                    var header = document.createElement('div');
                    header.className = 'animal-header';

                    // Miniatura da foto
                    if (animal.foto_url) {
                        var thumb = document.createElement('img');
                        thumb.src = animal.foto_url;
                        thumb.alt = 'Miniatura de ' + animal.nome;
                        thumb.className = 'animal-thumb';
                        header.appendChild(thumb);
                    }

                    var nome = document.createElement('strong');
                    nome.textContent = animal.nome;
                    var badge = document.createElement('span');
                    badge.className = 'badge-status badge-' + (animal.status === 'Adotado' ? 'Aprovada' : 'Pendente');
                    badge.textContent = animal.status || 'Disponível';
                    header.appendChild(nome);
                    header.appendChild(badge);
                    card.appendChild(header);

                    var corpo = document.createElement('div');
                    corpo.className = 'animal-corpo';

                    // View mode - dados do animal
                    var viewMode = document.createElement('div');
                    viewMode.className = 'animal-view';
                    var dados = [
                        ['Espécie', animal.especie],
                        ['Raça', animal.raca || 'Não informado'],
                        ['Idade', animal.idade],
                        ['Sexo', animal.sexo],
                        ['Porte', animal.porte],
                        ['Pelagem', animal.pelagem],
                        ['Descrição', animal.descricao],
                        ['Status', animal.status]
                    ];
                    dados.forEach(function (par) {
                        var linha = document.createElement('p');
                        var rotulo = document.createElement('strong');
                        rotulo.textContent = par[0] + ': ';
                        linha.appendChild(rotulo);
                        linha.appendChild(document.createTextNode(par[1] || 'Não informado'));
                        viewMode.appendChild(linha);
                    });
                    corpo.appendChild(viewMode);

                    // Edit mode - formulário inline (inicialmente oculto)
                    var editMode = document.createElement('div');
                    editMode.className = 'animal-edit oculto';
                    editMode.innerHTML = '\
                        <div class="edit-grid">\
                            <div class="edit-grupo">\
                                <label for="edit-nome-' + animal.id + '">Nome *</label>\
                                <input type="text" id="edit-nome-' + animal.id + '" maxlength="80" required>\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-especie-' + animal.id + '">Espécie *</label>\
                                <select id="edit-especie-' + animal.id + '" required>\
                                    <option value="Cão">Cão</option>\
                                    <option value="Gato">Gato</option>\
                                    <option value="Outro">Outro</option>\
                                </select>\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-raca-' + animal.id + '">Raça</label>\
                                <input type="text" id="edit-raca-' + animal.id + '" maxlength="80">\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-idade-' + animal.id + '">Idade *</label>\
                                <input type="text" id="edit-idade-' + animal.id + '" maxlength="40" required>\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-pelagem-' + animal.id + '">Pelagem *</label>\
                                <input type="text" id="edit-pelagem-' + animal.id + '" maxlength="80" required placeholder="Ex: Caramelo, Preta com manchas brancas">\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-sexo-' + animal.id + '">Sexo *</label>\
                                <select id="edit-sexo-' + animal.id + '" required>\
                                    <option value="Macho">Macho</option>\
                                    <option value="Fêmea">Fêmea</option>\
                                </select>\
                            </div>\
                            <div class="edit-grupo">\
                                <label for="edit-porte-' + animal.id + '">Porte *</label>\
                                <select id="edit-porte-' + animal.id + '" required>\
                                    <option value="Pequeno">Pequeno</option>\
                                    <option value="Médio">Médio</option>\
                                    <option value="Grande">Grande</option>\
                                </select>\
                            </div>\
                            <div class="edit-grupo full-width">\
                                <label for="edit-foto-' + animal.id + '">Foto do Animal</label>\
                                <input type="file" id="edit-foto-' + animal.id + '" accept="image/jpeg,image/png,image/webp">\
                                <span class="dica">JPG, PNG, WebP. Máx 5MB. Deixe em branco para manter a foto atual.</span>\
                            </div>\
                            <div class="edit-grupo full-width">\
                                <label for="edit-descricao-' + animal.id + '">Descrição *</label>\
                                <textarea id="edit-descricao-' + animal.id + '" rows="3" maxlength="300" required></textarea>\
                            </div>\
                            <div class="edit-grupo full-width">\
                                <label for="edit-status-' + animal.id + '">Status *</label>\
                                <select id="edit-status-' + animal.id + '" required>\
                                    <option value="Disponível">Disponível</option>\
                                    <option value="Adotado">Adotado</option>\
                                </select>\
                            </div>\
                        </div>\
                        <div class="edit-acoes">\
                            <button type="button" class="btn-principal btn-salvar-edit" data-id="' + animal.id + '">Salvar</button>\
                            <button type="button" class="btn-secundario btn-cancelar-edit" data-id="' + animal.id + '">Cancelar</button>\
                            <div class="edit-msg" aria-live="polite"></div>\
                        </div>\
                    ';
                    corpo.appendChild(editMode);

                    card.appendChild(corpo);

                    var acoes = document.createElement('div');
                    acoes.className = 'solicitacao-acoes';

                    var btnEditar = document.createElement('button');
                    btnEditar.type = 'button';
                    btnEditar.className = 'btn-editar';
                    btnEditar.textContent = 'Editar';
                    btnEditar.dataset.id = animal.id;
                    btnEditar.addEventListener('click', function () {
                        ativarModoEdicao(this.dataset.id);
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
        // Função legada - redireciona para inline
        ativarModoEdicao(id);
    }

    // ---------------- Inline Edição Animal ----------------
    function ativarModoEdicao(id) {
        var card = document.querySelector('.animal-card[data-animal-id="' + id + '"]');
        if (!card) return;

        var viewMode = card.querySelector('.animal-view');
        var editMode = card.querySelector('.animal-edit');
        var btnEditar = card.querySelector('.btn-editar');

        if (!viewMode || !editMode) return;

        // Preencher formulário com dados atuais
        var linhas = viewMode.querySelectorAll('p');
        var dados = {};
        linhas.forEach(function (linha) {
            var strong = linha.querySelector('strong');
            if (strong) {
                var key = strong.textContent.replace(':', '').trim().toLowerCase();
                var value = linha.textContent.replace(strong.textContent, '').trim();
                dados[key] = value === 'Não informado' ? '' : value;
            }
        });

        // Preencher campos do formulário
        var setValue = function (id, value) {
            var el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setValue('edit-nome-' + id, dados.nome);
        setValue('edit-especie-' + id, dados.espécie || 'Cão');
        setValue('edit-raca-' + id, dados.raça);
        setValue('edit-idade-' + id, dados.idade);
        setValue('edit-pelagem-' + id, dados.pelagem);
        setValue('edit-sexo-' + id, dados.sexo || 'Macho');
        setValue('edit-porte-' + id, dados.porte || 'Pequeno');
        setValue('edit-descricao-' + id, dados.descrição);
        setValue('edit-status-' + id, dados.status || 'Disponível');

        // Alternar visibilidade
        viewMode.classList.add('oculto');
        editMode.classList.remove('oculto');

        // Esconder botão editar, mostrar ações de salvar/cancelar
        var btnEditarEl = card.querySelector('.btn-editar');
        if (btnEditarEl) btnEditarEl.classList.add('edit-btn-hidden');

        // Adicionar event listeners aos botões do modo edição
        var btnSalvar = editMode.querySelector('.btn-salvar-edit');
        var btnCancelar = editMode.querySelector('.btn-cancelar-edit');

        if (btnSalvar) {
            btnSalvar.onclick = function () { salvarEdicaoInline(id); };
        }
        if (btnCancelar) {
            btnCancelar.onclick = function () { cancelarEdicao(id); };
        }
    }

    function cancelarEdicao(id) {
        var card = document.querySelector('.animal-card[data-animal-id="' + id + '"]');
        if (!card) return;

        var viewMode = card.querySelector('.animal-view');
        var editMode = card.querySelector('.animal-edit');
        var btnEditarEl = card.querySelector('.btn-editar');

        viewMode.classList.remove('oculto');
        editMode.classList.add('oculto');
        if (btnEditarEl) btnEditarEl.classList.remove('edit-btn-hidden');

        var msgEl = card.querySelector('.edit-msg');
        if (msgEl) msgEl.textContent = '';
    }

    async function salvarEdicaoInline(id) {
        var card = document.querySelector('.animal-card[data-animal-id="' + id + '"]');
        if (!card) return;

        var msgEl = card.querySelector('.edit-msg');
        var btnSalvar = card.querySelector('.btn-salvar-edit');

        // Coleta dados do formulário
        var getValue = function (suffix) {
            var el = document.getElementById('edit-' + suffix + '-' + id);
            return el ? el.value.trim() : '';
        };

        var getFile = function (suffix) {
            var el = document.getElementById('edit-' + suffix + '-' + id);
            return (el?.files?.[0]) ? el.files[0] : null;
        };

        var obrigatorios = [
            ['nome', 'Informe o nome do animal.'],
            ['especie', 'Selecione a espécie.'],
            ['idade', 'Informe a idade do animal.'],
            ['sexo', 'Selecione o sexo.'],
            ['porte', 'Selecione o porte.'],
            ['descricao', 'Descreva a história do animal.'],
            ['pelagem', 'Informe a pelagem.'],
            ['status', 'Selecione o status.']
        ];

        for (var i = 0; i < obrigatorios.length; i++) {
            var val = getValue(obrigatorios[i][0]);
            if (!val) {
                msgEl.textContent = obrigatorios[i][1];
                msgEl.className = 'edit-msg erro';
                return;
            }
        }

        var status = getValue('status');
        if (status !== 'Disponível' && status !== 'Adotado') {
            msgEl.textContent = 'Status inválido. Use Disponível ou Adotado.';
            msgEl.className = 'edit-msg erro';
            return;
        }

        var arquivoFoto = getFile('foto');
        var EXTENSAO_POR_MIME = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };

        if (arquivoFoto) {
            if (arquivoFoto.size > TAMANHO_MAX_FOTO) {
                msgEl.textContent = 'A foto deve ter no máximo 5MB.';
                msgEl.className = 'edit-msg erro';
                return;
            }
            if (!EXTENSAO_POR_MIME[arquivoFoto.type]) {
                msgEl.textContent = 'Formato não aceito. Use JPG, PNG ou WebP.';
                msgEl.className = 'edit-msg erro';
                return;
            }
        }

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
        msgEl.textContent = '';
        msgEl.className = 'edit-msg';

        try {
            var dadosAnimal = {
                nome: getValue('nome'),
                especie: getValue('especie'),
                raca: getValue('raca') || null,
                idade: getValue('idade'),
                sexo: getValue('sexo'),
                porte: getValue('porte'),
                pelagem: getValue('pelagem'),
                descricao: getValue('descricao'),
                status: status
            };

            if (arquivoFoto) {
                var extensao = EXTENSAO_POR_MIME[arquivoFoto.type];
                var caminhoFoto = 'animais/' + crypto.randomUUID() + '.' + extensao;

                var upload = await cliente.storage
                    .from('fotos-animais')
                    .upload(caminhoFoto, arquivoFoto);

                if (upload.error) throw upload.error;

                var urlData = cliente.storage
                    .from('fotos-animais')
                    .getPublicUrl(caminhoFoto);

                dadosAnimal.foto_url = urlData.data.publicUrl;
            }

            var dbResp = await cliente.from('animais').update(dadosAnimal).eq('id', id);
            if (dbResp.error) throw dbResp.error;

            // Atualizar view mode com novos dados
            atualizarViewMode(card, dadosAnimal);

            // Voltar para view mode
            var viewMode = card.querySelector('.animal-view');
            var editMode = card.querySelector('.animal-edit');
            var btnEditarEl = card.querySelector('.btn-editar');

            viewMode.classList.remove('oculto');
            editMode.classList.add('oculto');
            if (btnEditarEl) btnEditarEl.classList.remove('edit-btn-hidden');

            msgEl.textContent = '';
            msgEl.className = 'edit-msg';

            mostrarFeedback('Animal atualizado com sucesso!', false);
        } catch (err) {
            console.error(err);
            msgEl.textContent = 'Erro ao editar animal: ' + err.message;
            msgEl.className = 'edit-msg erro';
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar';
        }
    }

    function atualizarViewMode(card, dados) {
        var viewMode = card.querySelector('.animal-view');
        if (!viewMode) return;

        var linhas = viewMode.querySelectorAll('p');
        var mapa = {
            'espécie': 'especie',
            'raça': 'raca',
            'idade': 'idade',
            'sexo': 'sexo',
            'porte': 'porte',
            'pelagem': 'pelagem',
            'descrição': 'descricao',
            'status': 'status'
        };

        linhas.forEach(function (linha) {
            var strong = linha.querySelector('strong');
            if (strong) {
                var key = strong.textContent.replace(':', '').trim().toLowerCase();
                var campo = mapa[key];
                if (campo && dados[campo] !== undefined) {
                    // Remove o texto antigo mantendo o strong
                    var textoAntigo = linha.textContent.replace(strong.textContent, '').trim();
                    linha.removeChild(linha.lastChild);
                    linha.appendChild(document.createTextNode(dados[campo] || 'Não informado'));
                }
                }
            });

            // Atualizar badge de status
        var badge = card.querySelector('.badge-status');
        if (badge && dados.status) {
            badge.className = 'badge-status badge-' + (dados.status === 'Adotado' ? 'Aprovada' : 'Pendente');
            badge.textContent = dados.status;
        }

        // Atualizar nome no header
        var nomeEl = card.querySelector('.animal-header strong');
        if (nomeEl && dados.nome) {
            nomeEl.textContent = dados.nome;
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

    // ---------------- Transparência Admin ----------------
    var ehGerenteTransparencia = false;
    var TAMANHO_MAX_TRANSPARENCIA = 10 * 1024 * 1024; // 10MB
    var MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    async function carregarTransparenciaAdmin() {
        var ehGerente = await verificarGerenteTransparencia();
        ehGerenteTransparencia = ehGerente;

        var abaTransparencia = document.getElementById('aba-transparencia');
        if (abaTransparencia) {
            if (ehGerente) {
                abaTransparencia.hidden = false;
            } else {
                abaTransparencia.hidden = true;
                if (abaTransparencia.classList.contains('ativa')) {
                    mudarAba('solicitacoes');
                }
            }
        }

        if (!ehGerente) return;

        // Popular anos (2018 até 2050) — permite cadastro até 2050
        var anoAtual = new Date().getFullYear();
        var selectAno = document.getElementById('transp-ano');
        selectAno.innerHTML = '<option value="">Selecione o ano</option>';
        for (var a = 2018; a <= 2050; a++) {
            var opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            selectAno.appendChild(opt);
        }

        // Event listeners
        selectAno.addEventListener('change', function () {
            var mesSelect = document.getElementById('transp-mes');
            if (this.value) {
                mesSelect.disabled = false;
                mesSelect.innerHTML = '<option value="">Selecione o mês</option>';
                for (var m = 1; m <= 12; m++) {
                    var opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = MESES[m];
                    mesSelect.appendChild(opt);
                }
            } else {
                mesSelect.disabled = true;
                mesSelect.innerHTML = '<option value="">Selecione o mês</option>';
            }
        });

        document.getElementById('form-transparencia').addEventListener('submit', handleEnviarTransparencia);
        carregarListaTransparenciaAdmin();
    }

    function mostrarFeedbackTransparencia(msg, ehErro) {
        var caixa = document.getElementById('msg-status-transparencia');
        caixa.textContent = '';
        caixa.classList.remove('sucesso', 'erro');
        if (!msg) return;
        caixa.textContent = msg;
        caixa.classList.add(ehErro ? 'erro' : 'sucesso');
    }

    async function handleEnviarTransparencia(e) {
        e.preventDefault();

        var btnSubmit = document.getElementById('btn-enviar-transparencia');
        var arquivoInput = document.getElementById('transp-arquivo');
        var ano = document.getElementById('transp-ano').value;
        var mes = document.getElementById('transp-mes').value;

        if (!ano || !mes) {
            mostrarFeedbackTransparencia('Selecione o ano e o mês.', true);
            return;
        }

        var arquivo = arquivoInput.files?.[0];
        if (!arquivo) {
            mostrarFeedbackTransparencia('Selecione um arquivo PDF.', true);
            return;
        }

        if (arquivo.type !== 'application/pdf') {
            mostrarFeedbackTransparencia('Apenas arquivos PDF são permitidos.', true);
            return;
        }

        if (arquivo.size > TAMANHO_MAX_TRANSPARENCIA) {
            mostrarFeedbackTransparencia('Arquivo deve ter no máximo 10MB.', true);
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';
        mostrarFeedbackTransparencia('', false);

        try {
            var formData = new FormData();
            formData.append('arquivo', arquivo);
            formData.append('ano', ano);
            formData.append('mes', mes);

            var resp = await fetch('/functions/v1/transparencia/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (await cliente.auth.getSession()).data.session.access_token
                },
                body: formData
            });

            var resultado = await resp.json();

            if (!resp.ok) throw new Error(resultado.error || 'Erro ao enviar relatório');

            document.getElementById('form-transparencia').reset();
            document.getElementById('transp-mes').disabled = true;
            document.getElementById('transp-mes').innerHTML = '<option value="">Selecione o mês</option>';
            mostrarFeedbackTransparencia(resultado.mensagem || 'Relatório enviado com sucesso!', false);
            carregarListaTransparenciaAdmin();
        } catch (err) {
            console.error(err);
            mostrarFeedbackTransparencia('Erro ao enviar relatório: ' + err.message, true);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Relatório';
        }
    }

    async function carregarListaTransparenciaAdmin() {
        var container = document.getElementById('lista-transparencia-admin');
        container.textContent = '';
        var p = document.createElement('p');
        p.className = 'carregando';
        p.textContent = 'Carregando relatórios...';
        container.appendChild(p);

        try {
            var { data, error } = await cliente
                .from('transparencia_relatorios')
                .select('id, ano, mes, arquivo_nome, arquivo_tamanho, criado_em, atualizado_em, enviado_por')
                .eq('status_exclusao', 'ativo')
                .order('ano', { ascending: false })
                .order('mes', { ascending: false });

            if (error) throw error;

            container.textContent = '';

            if (!data || data.length === 0) {
                var vazio = document.createElement('p');
                vazio.className = 'transparencia-vazio-admin';
                vazio.textContent = 'Nenhum relatório publicado ainda.';
                container.appendChild(vazio);
                return;
            }

            var titulo = document.createElement('h3');
            titulo.textContent = 'Relatórios Publicados (' + data.length + ')';
            container.appendChild(titulo);

            data.forEach(function (rel) {
                var card = document.createElement('div');
                card.className = 'transparencia-admin-card';

                var dataAtualizacao = new Date(rel.atualizado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                var tamanhoMB = (rel.arquivo_tamanho / (1024 * 1024)).toFixed(2);

                card.innerHTML = '\
                    <div class="transparencia-admin-card-header">\
                        <div class="transparencia-admin-card-info">\
                            <h4>' + rel.arquivo_nome + '</h4>\
                            <div class="transparencia-admin-card-meta">\
                                <span>📅 ' + MESES[rel.mes] + '/' + rel.ano + '</span>\
                                <span>📄 ' + tamanhoMB + ' MB</span>\
                                <span>🕐 Atualizado: ' + dataAtualizacao + '</span>\
                            </div>\
                        </div>\
                        <div class="transparencia-admin-card-acoes">\
                            <button type="button" class="btn-remover" data-ano="' + rel.ano + '" data-mes="' + rel.mes + '">🗑️ Remover</button>\
                        </div>\
                    ';

                container.appendChild(card);
            });

            // Event listeners para botões de remover
            container.querySelectorAll('.btn-remover').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var ano = parseInt(this.dataset.ano, 10);
                    var mes = parseInt(this.dataset.mes, 10);
                    if (confirm('Tem certeza que deseja remover o relatório de ' + MESES[mes] + '/' + ano + '? Esta ação não pode ser desfeita.')) {
                        removerTransparencia(ano, mes);
                    }
                });
            });
        } catch (err) {
            console.error('Erro ao carregar lista de transparência:', err);
            container.textContent = '';
            var msg = document.createElement('p');
            msg.className = 'transparencia-erro';
            msg.textContent = 'Erro ao carregar relatórios: ' + err.message;
            container.appendChild(msg);
        }
    }

    async function removerTransparencia(ano, mes) {
        var btn = document.querySelector('.btn-remover[data-ano="' + ano + '"][data-mes="' + mes + '"]');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Removendo...';
        }

        try {
            var resp = await fetch('/functions/v1/transparencia/delete?ano=' + ano + '&mes=' + mes, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + (await cliente.auth.getSession()).data.session.access_token
                }
            });

            var resultado = await resp.json();
            if (!resp.ok) throw new Error(resultado.error || 'Erro ao remover relatório');

            carregarListaTransparenciaAdmin();
        } catch (err) {
            console.error(err);
            window.alert('Erro ao remover relatório: ' + err.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🗑️ Remover';
            }
        }
    }

    verificarAcesso();
})();