// transparencia.js - Lógica da página pública de transparência financeira
(function () {
    'use strict';

    // Configuração do Supabase - URL pública, chave anon carregada do HTML
    const SUPABASE_URL = 'https://fnlqruzbgwffhrqmpfvi.supabase.co';
    const SUPABASE_ANON_KEY = document.querySelector('meta[name="supabase-key"]')?.content || '';

    let currentAno = null;
    let currentMes = null;

    const filtroAno = document.getElementById('filtro-ano');
    const filtroMes = document.getElementById('filtro-mes');
    const resultadosDiv = document.getElementById('transparencia-resultados');
    const carregandoDiv = document.getElementById('transparencia-carregando');

    const MESES = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Initialize Supabase client
    let supabaseClient = null;
    function getSupabase() {
        if (!supabaseClient && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }

    async function carregarAnos() {
        try {
            // Gerar anos dinamicamente de 2018 até 2050 (independente do banco)
            filtroAno.innerHTML = '<option value="">Selecione o ano</option>';
            for (let a = 2018; a <= 2050; a++) {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                filtroAno.appendChild(opt);
            }
        } catch (err) {
            console.error('Erro ao carregar anos:', err);
            filtroAno.innerHTML = '<option value="">Erro ao carregar anos</option>';
        }
    }

    async function atualizarMeses(ano) {
        if (!ano) {
            filtroMes.innerHTML = '<option value="">Selecione o mês</option>';
            filtroMes.disabled = true;
            return;
        }

        try {
            const supabase = getSupabase();
            if (!supabase) return;

            // Buscar apenas meses distintos para o ano selecionado (sem carregar relatórios)
            const { data, error } = await supabase
                .from('transparencia_relatorios')
                .select('mes')
                .eq('ano', parseInt(ano, 10))
                .order('mes', { ascending: false });

            if (error) throw error;

            const mesesDisponiveis = [...new Set((data || []).map(r => r.mes))]
                .sort((a, b) => b - a);

            filtroMes.innerHTML = '<option value="">Selecione o mês</option>';
            if (mesesDisponiveis.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Nenhum relatório neste ano';
                opt.disabled = true;
                filtroMes.appendChild(opt);
                filtroMes.disabled = true;
            } else {
                mesesDisponiveis.forEach(mes => {
                    const opt = document.createElement('option');
                    opt.value = mes;
                    opt.textContent = MESES[mes];
                    filtroMes.appendChild(opt);
                });
                filtroMes.disabled = false;
            }
        } catch (err) {
            console.error('Erro ao atualizar meses:', err);
            filtroMes.innerHTML = '<option value="">Erro ao carregar meses</option>';
            filtroMes.disabled = true;
        }
    }

    async function carregarRelatorios(ano, mes) {
        if (!ano || !mes) {
            mostrarVazio('Selecione o mês e o ano para consultar o relatório de transparência.');
            return;
        }

        mostrarCarregando(true);
        resultadosDiv.innerHTML = '';

        try {
            const supabase = getSupabase();
            if (!supabase) throw new Error('Supabase não disponível');

            const { data, error } = await supabase
                .from('transparencia_relatorios')
                .select('id, ano, mes, arquivo_nome, arquivo_tamanho, criado_em, atualizado_em, enviado_por')
                .eq('ano', parseInt(ano, 10))
                .eq('mes', parseInt(mes, 10))
                .order('atualizado_em', { ascending: false });

            if (error) throw error;

            mostrarCarregando(false);

            if (!data || data.length === 0) {
                mostrarVazio(`Nenhum relatório publicado para ${MESES[parseInt(mes, 10)]}/${ano}.`);
                return;
            }

            renderizarRelatorios(data);
        } catch (err) {
            console.error('Erro ao carregar relatórios:', err);
            mostrarCarregando(false);
            mostrarErro('Erro ao carregar relatórios. Tente novamente mais tarde.');
        }
    }

    function renderizarRelatorios(relatorios) {
        resultadosDiv.innerHTML = '';

        const lista = document.createElement('div');
        lista.className = 'transparencia-lista';

        relatorios.forEach(rel => {
            const card = document.createElement('div');
            card.className = 'transparencia-card';

            const dataAtualizacao = new Date(rel.atualizado_em).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const tamanhoMB = (rel.arquivo_tamanho / (1024 * 1024)).toFixed(2);

            card.innerHTML = `
                <div class="transparencia-card-info">
                    <h3>${rel.arquivo_nome}</h3>
                    <div class="transparencia-card-meta">
                        <span>📅 Atualizado em: ${dataAtualizacao}</span>
                        <span>📄 Tamanho: ${tamanhoMB} MB</span>
                        ${rel.enviado_por ? `<span>👤 Enviado por: ${rel.enviado_por}</span>` : ''}
                    </div>
                </div>
                <div class="transparencia-card-acoes">
                    <a href="/functions/v1/transparencia/download?ano=${rel.ano}&mes=${rel.mes}"
                       class="btn btn-download"
                       download="${rel.arquivo_nome}">
                        📥 Baixar PDF
                    </a>
                </div>
            `;

            lista.appendChild(card);
        });

        resultadosDiv.appendChild(lista);
    }

    function mostrarVazio(msg) {
        resultadosDiv.innerHTML = `<p class="transparencia-vazio">${msg}</p>`;
    }

    function mostrarErro(msg) {
        resultadosDiv.innerHTML = `<p class="transparencia-erro">${msg}</p>`;
    }

    function mostrarCarregando(mostrar) {
        carregandoDiv.classList.toggle('oculto', !mostrar);
        if (mostrar) {
            resultadosDiv.innerHTML = '';
        }
    }

    function formatFileName(ano, mes) {
        return `transparencia-${ano}-${mes.toString().padStart(2, '0')}.pdf`;
    }

    // Event listeners
    filtroAno.addEventListener('change', function () {
        const ano = this.value;
        currentAno = ano ? parseInt(ano, 10) : null;
        filtroMes.value = '';
        currentMes = null;
        atualizarMeses(ano);
        if (!ano) {
            mostrarVazio('Selecione o mês e o ano para consultar o relatório de transparência.');
        }
    });

    filtroMes.addEventListener('change', function () {
        const mes = this.value;
        currentMes = mes ? parseInt(mes, 10) : null;
        if (currentAno && currentMes) {
            carregarRelatorios(currentAno, currentMes);
        } else {
            mostrarVazio('Selecione o mês e o ano para consultar o relatório de transparência.');
        }
    });

    // Initialize on load
    document.addEventListener('DOMContentLoaded', function () {
        // Wait for Supabase to be ready
        const checkSupabase = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkSupabase);
                carregarAnos();
            }
        }, 100);
    });
})();