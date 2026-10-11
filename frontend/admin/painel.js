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
        btns.forEach(function (b) { b.classList.remove('ativa'); });
        if (aba === 'solicitacoes') {
            btns[0].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.remove('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
            carregarSolicitacoes();
        } else if (aba === 'animais') {
            btns[1].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.remove('oculto');
            document.getElementById('secao-cadastrar').classList.add('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
            carregarAnimais();
        } else if (aba === 'cadastrar') {
            btns[2].classList.add('ativa');
            document.getElementById('secao-solicitacoes').classList.add('oculto');
            document.getElementById('secao-animais').classList.add('oculto');
            document.getElementById('secao-cadastrar').classList.remove('oculto');
            document.getElementById('secao-transparencia').classList.add('oculto');
        } else if (aba === 'transparencia') {
            btns[3].classList.add('ativa');
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
            corpo.className = 'solicitacao-corpo';
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
            .select('*')
            .eq('id', id)
            .single();
        if (resp.error || !resp.data) {
            window.alert('Erro ao carregar animal: ' + (resp.error ? resp.error.message : 'não encontrado'));
            return;
        }
        var animal = resp.data;

        // Preencher o modal com os dados do animal
        document.getElementById('editar-animal-id').value = animal.id;
        document.getElementById('editar-nome').value = animal.nome || '';
        document.getElementById('editar-especie').value = animal.especie || 'Cão';
        document.getElementById('editar-raca').value = animal.raca || '';
        document.getElementById('editar-idade').value = animal.idade || '';
        document.getElementById('editar-pelagem').value = animal.pelagem || '';
        document.getElementById('editar-sexo').value = animal.sexo || 'Macho';
        document.getElementById('editar-porte').value = animal.porte || 'Pequeno';
        document.getElementById('editar-descricao').value = animal.descricao || '';
        document.getElementById('editar-status').value = animal.status || 'Disponível';

        // Mostrar miniatura da foto atual se houver
        var fotoAtual = document.getElementById('editar-foto-atual');
        if (animal.foto_url) {
            if (!fotoAtual) {
                var img = document.createElement('img');
                img.id = 'editar-foto-atual';
                img.src = animal.foto_url;
                img.alt = 'Foto atual de ' + animal.nome;
                img.className = 'editar-foto-atual';
                var fotoInput = document.getElementById('editar-foto');
                fotoInput.parentNode.insertBefore(img, fotoInput.nextSibling);
            } else {
                fotoAtual.src = animal.foto_url;
                fotoAtual.alt = 'Foto atual de ' + animal.nome;
            }
        } else if (fotoAtual) {
            fotoAtual.remove();
        }

        // Abrir modal
        var modal = document.getElementById('editarAnimalModal');
        modal.classList.add('active');
        document.body.classList.add('modal-open');
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

    // ---------------- Modal Edição Animal ----------------
    function fecharModalEditar() {
        var modal = document.getElementById('editarAnimalModal');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.getElementById('form-editar-animal').reset();
        var fotoAtual = document.getElementById('editar-foto-atual');
        if (fotoAtual) fotoAtual.remove();
    }

    document.getElementById('fecharEditarAnimal').addEventListener('click', fecharModalEditar);
    document.getElementById('btn-cancelar-edicao').addEventListener('click', fecharModalEditar);

    document.getElementById('form-editar-animal').addEventListener('submit', async function (e) {
        e.preventDefault();

        var btnSubmit = document.getElementById('btn-salvar-edicao');
        var fotoInput = document.getElementById('editar-foto');
        var msgStatus = document.getElementById('msg-status-edicao');

        // Validação dos campos obrigatórios
        var obrigatorios = [
            ['editar-nome', 'Informe o nome do animal.'],
            ['editar-especie', 'Selecione a espécie.'],
            ['editar-idade', 'Informe a idade do animal.'],
            ['editar-sexo', 'Selecione o sexo.'],
            ['editar-porte', 'Selecione o porte.'],
            ['editar-descricao', 'Descreva a história do animal.'],
            ['editar-pelagem', 'Selecione a pelagem.'],
            ['editar-status', 'Selecione o status.']
        ];

        for (var i = 0; i < obrigatorios.length; i++) {
            var campo = document.getElementById(obrigatorios[i][0]);
            if (campo.value.trim() === '') {
                msgStatus.textContent = obrigatorios[i][1];
                msgStatus.className = 'mensagem-status erro';
                campo.focus();
                return;
            }
        }

        // Validação de status
        var status = document.getElementById('editar-status').value;
        if (status !== 'Disponível' && status !== 'Adotado') {
            msgStatus.textContent = 'Status inválido. Use Disponível ou Adotado.';
            msgStatus.className = 'mensagem-status erro';
            return;
        }

        var id = document.getElementById('editar-animal-id').value;
        if (!id) {
            msgStatus.textContent = 'Erro: ID do animal não encontrado.';
            msgStatus.className = 'mensagem-status erro';
            return;
        }

        var arquivoFoto = fotoInput.files?.[0];
        var EXTENSAO_POR_MIME = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };

        if (arquivoFoto) {
            if (arquivoFoto.size > TAMANHO_MAX_FOTO) {
                msgStatus.textContent = 'A foto deve ter no máximo 5MB.';
                msgStatus.className = 'mensagem-status erro';
                return;
            }
            if (!EXTENSAO_POR_MIME[arquivoFoto.type]) {
                msgStatus.textContent = 'Formato não aceito. Use JPG, PNG ou WebP.';
                msgStatus.className = 'mensagem-status erro';
                return;
            }
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Salvando...';
        msgStatus.textContent = '';
        msgStatus.className = 'mensagem-status';

        try {
            var dadosAnimal = {
                nome: document.getElementById('editar-nome').value.trim(),
                especie: document.getElementById('editar-especie').value,
                raca: document.getElementById('editar-raca').value.trim() || null,
                idade: document.getElementById('editar-idade').value.trim(),
                sexo: document.getElementById('editar-sexo').value,
                porte: document.getElementById('editar-porte').value,
                pelagem: document.getElementById('editar-pelagem').value,
                descricao: document.getElementById('editar-descricao').value.trim(),
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

            fecharModalEditar();
            carregarAnimais();
            mostrarFeedback('Animal atualizado com sucesso!', false);
        } catch (err) {
            console.error(err);
            msgStatus.textContent = 'Erro ao editar animal: ' + err.message;
            msgStatus.className = 'mensagem-status erro';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Salvar Alterações';
        }
    });

    // Fechar modal ao clicar fora
    document.getElementById('editarAnimalModal').addEventListener('click', function (e) {
        if (e.target === this) fecharModalEditar();
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('editarAnimalModal');
            if (modal.classList.contains('active')) fecharModalEditar();
        }
    });

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

        // Popular anos (2018 até ano atual + 1)
        var anoAtual = new Date().getFullYear();
        var selectAno = document.getElementById('transp-ano');
        selectAno.innerHTML = '<option value="">Selecione o ano</option>';
        for (var a = 2018; a <= anoAtual + 1; a++) {
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