# STATE.md — Estado Atual do Projeto Adota Patos

> Resumo rápido para qualquer agente que esteja chegando. Última atualização: 2026-10-30.

## Última atualização
- **Data:** 2026-10-30
- **Por:** agente OpenCode (implementação PUCP)

## Etapa atual
- Projeto em manutenção/correção visual do catálogo (branch `feat/fix-visual-layout-preserve`).
- Implementação do protocolo PUCP (continuidade/rastreabilidade/handoff) concluída nesta sessão.
- Funcionalidade "ver senha" removida por decisão de segurança (T-046 ADIADO).
- Revisão de `app.js` concluída (T-038): restaurado para versão limpa de `origin/main`, corrigido emoji mojibake. Suite E2E: 190 passed, 150 skipped, 0 failed.
- Limpeza de artefatos concluída (T-040): removidos ZAP, stdout, test-results, .temp, arquivo corrompido; .gitignore complementado.
- Cobertura de testes expandida (T-039): adicionado `login-painel-acesso.spec.ts` (14 testes) + `rls-anon.spec.ts` (6 testes) + `transparencia-upload-edge.spec.ts` (6 testes). Suite total: 221 passed, 151 skipped, 0 failed.
- Handoff para a ONG concluído (T-047): `docs/HANDOFF-ONG.md` criado com instruções de uso e manutenção.

## Objetivo em andamento
Corrigir o layout do catálogo de animais (3 cards/linha desktop, 2 tablet, 1 mobile) com validação visual real no navegador, além de resolver pendências P0/P1.

## Tarefa ativa
- Nenhuma tarefa de código ativa nesta sessão (apenas implementação do PUCP).
- Próxima tarefa recomendada: **T-037** (validação visual do catálogo) e depois **T-033** (lembrar-me) / **T-034** (fetch relativo) - ver TASKS.md.

## Últimas entregas
- PUCP implementado: `AGENTS.md`, `docs/project/{PROJECT,TASKS,ROADMAP,STATE,DECISIONS,HANDOFF}.md`, `docs/project/history/`.
- Último commit relevante: `4ebf4eb fix(merge): resolve conflict, preserve test mode with pelagem` (2026-10-19).
- PR #109 (correção de largura do catálogo) mergeado em `main` (`5824a1d`).
- Handoffs anteriores preservados: `docs/HANDOFF-HERMES.md`, `docs/HANDOFF-OPENCODE.md`.

## Situação dos testes
- Última execução registrada: 16/16 passando (Playwright E2E, 2026-09-29).
- Não re-executados nesta sessão (nenhuma alteração de código).
- Suite não cobre RLS, Edge Function, login, painel nem upload.

## Problemas conhecidos
1. (P0) "Lembrar-me" não mantém sessão - RESOLVIDO. Causa raiz corrigida em `sessao.js` + auto-redirect em `login.js`. Validado via CDP (sessão persiste após fechar/reabrir navegador; painel carrega sem pedir login). (T-033 CONCLUÍDO)
2. (P0) `painel.js` fetch relativo - corrigido para URL absoluta do Supabase (upload e delete). Pendente validação em produção.
3. (P1) Migrations `20261017000004/0005/0006` aplicadas no remoto (T-035 CONCLUÍDO).
4. (P1) Edge Functions `confirmar-doacao-monetaria` e `receber-doacao-monetaria` deployadas e ACTIVE (T-036 CONCLUÍDO).
5. Layout do catálogo validado visualmente via CDP (2026-10-30): 3/2/1 colunas (desktop/tablet/mobile), img 250px cover, sem compressão, grid não aninhado em .section-header. (T-037 CONCLUÍDO)

## Bloqueios
- Validação visual depende de navegador gráfico compartilhado com o usuário (CDP não funcional para `github.io`).
- Publicação (commit/push/deploy) requer autorização do responsável.

## Decisões recentes
- Adoção do PUCP em 2026-10-30 (este repositório armazena sua memória operacional).
- Estrutura `docs/project/` adicionada sem remover documentos existentes.
- Layout visual protegido (REGRAS.md, 2026-10-18).

## Branch e último commit relevante
- Branch atual: `main` (após merge do PR #110)
- HEAD: `4e02599`
- origin/main: `5824a1d`

## Situação das alterações não commitadas
- 4 arquivos modificados: `REGRAS.md`, `frontend/css/estilo.css`, `frontend/index.html`, `frontend/js/app.js`.
- Muitos arquivos untracked (migrations, Edge Functions, testes, relatórios, artefatos ZAP, handoffs, `stdout/`, `deno.lock`, arquivo com nome corrompido).
- Preservar: não usar `git clean` nem `git reset --hard`.

## Próxima ação recomendada
1. Revisar e aprovar o PR #110 (https://github.com/johnsalviano/adota-patos/pull/110) para merge em `main`.
2. (Opcional) Expandir cobertura de testes (T-039): RLS, Edge Function, login, painel, upload.

## Tarefas concluídas nesta sessão
- T-033 (Lembrar-me), T-034 (fetch relativo), T-035 (migrations), T-036 (Edge Functions), T-037 (layout catálogo), T-038 (revisão app.js), T-040 (limpeza artefatos), T-046 (removido "ver senha").

---
*Ver detalhes em TASKS.md, HANDOFF.md, DECISIONS.md, DOCUMENTACAO.md.*