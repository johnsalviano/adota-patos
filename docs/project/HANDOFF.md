# HANDOFF.md — Como Continuar de Onde Parou (Adota Patos)

> Consolidado de `docs/HANDOFF-HERMES.md` e `docs/HANDOFF-OPENCODE.md` (2026-10-19). Atualizado em 2026-10-30 com a implementação do PUCP.

## 1. Resumo executivo
- Site de adoção de animais em Patos-PB, publicado em https://johnsalviano.github.io/adota-patos/ (GitHub Pages).
- Página local de desenvolvimento: http://localhost:8080/.
- Branch atual: `feat/pucp-e-correcoes-p0`. HEAD: ver `git log`.
- P0 resolvidos: "Lembrar-me" (sessão persistente + auto-preenchimento + auto-submit), `painel.js` fetch relativo → URL absoluta.
- P1 resolvidos: migrations 0004/0005/0006 aplicadas; Edge Functions `confirmar-doacao-monetaria` e `receber-doacao-monetaria` deployadas (ACTIVE).
- PUCP implementado (AGENTS.md + docs/project/).
- Funcionalidade "ver senha" removida por decisão de segurança (T-046 ADIADO).

## 2. Estado real do repositório
- Branch: `feat/fix-visual-layout-preserve`
- HEAD: `4ebf4eb fix(merge): resolve conflict, preserve test mode with pelagem`
- origin/main: `5824a1d`
- 4 arquivos modificados não commitados: `REGRAS.md`, `frontend/css/estilo.css`, `frontend/index.html`, `frontend/js/app.js`.
- Muitos untracked (migrations, Edge Functions, testes, relatórios, artefatos ZAP, handoffs, `stdout/`, `deno.lock`, arquivo com nome corrompido).
- Preservar: não usar `git clean` nem `git reset --hard`. 4 stashes existentes.

## 3. Supabase
- Projeto remoto: https://fnlqruzbgwffhrqmpfvi.supabase.co
- 19 migrations aplicadas (incluindo `perfil_acesso` e `status_exclusao`).
- 10 tabelas públicas com RLS habilitado.
- 6 Edge Functions ACTIVE.
- `perfis_membros`: 2 registros (1 gerente, 1 colaborador); sem registro de `desenvolvedor`.

## 4. Pendências conhecidas (P0/P1)
1. (P0) "Lembrar-me" não mantém sessão - RESOLVIDO. Corrigido em `sessao.js` + auto-redirect em `login.js`. Validado via CDP (persiste após fechar/reabrir; painel carrega sem pedir login). (T-033 CONCLUÍDO)
2. (P0) `painel.js` fetch relativo - corrigido para URL absoluta do Supabase (upload e delete). Pendente validação em produção. (T-034)
3. (P1) Migrations `20261017000004/0005/0006` aplicadas no remoto (T-035 CONCLUÍDO).
4. (P1) Edge Functions `confirmar-doacao-monetaria` e `receber-doacao-monetaria` deployadas e ACTIVE (T-036 CONCLUÍDO).

## 5. Regras permanentes de trabalho
- Frase-gatilho "Abra o navegador com depuração ao vivo." = abrir/reutilizar Chrome real com CDP.
- Não matar processos do Chrome indiscriminadamente.
- Não confiar em previews de console/screenshots estáticos como prova de layout.
- Não publicar sem confirmação do responsável.
- Não criar animais fictícios em produção.
- Português brasileiro simples, respostas concisas, sem loops.
- Autonomia operacional progressiva.
- Layout visual protegido (REGRAS.md, 2026-10-18).
- Zero segredos / zero rastros.
- Documentação atualizada junto com código.

## 6. Plano recomendado para retomar
1. Rodar `git status`, `git diff` e comparar com `6c8d514` antes de qualquer alteração.
2. Reproduzir em `http://localhost:8080` com CDP, inspecionando `#catalogo-animais`, `.animals-grid`, `.animal-card`.
3. Validar 1440px (3 col), 768px (2 col), 390px (1 col).
4. Corrigir apenas a causa comprovada.
5. Manter MOCK_ANIMALS, TEST_COUNT, pelagem e Supabase sem alterar produção.
6. Não commitar nem publicar até aprovação visual.

## 7. Ações proibidas (primeira etapa)
- Não fazer commit, push, merge, deploy ou publicação.
- Não restaurar arquivos inteiros de commits antigos sem `git diff`.
- Não alterar banco de produção nem rodar migrations no Supabase.
- Não criar animais fictícios em produção.
- Não expor credenciais/tokens/segredos.
- Não matar processos do Chrome do usuário.
- Não declarar localhost corrigido sem validação visual real.
- Não tratar site publicado como prova de alterações locais.

## 8. Incertezas restantes
- Diff de `frontend/js/app.js` (working tree) não revisado linha a linha.
- Layout local não validado visualmente pelo responsável.
- CDP travou/não expôs targets de `github.io` durante investigação.
- Site publicado reflete HEAD de `main`, não o working tree local.

## 9. Referências
- `docs/HANDOFF-HERMES.md` (preservado)
- `docs/HANDOFF-OPENCODE.md` (preservado)
- `REGRAS.md`, `docs/DOCUMENTACAO.md`, `docs/MODELO_CONCEITUAL.md`
- `STATE.md`, `TASKS.md`, `ROADMAP.md`, `DECISIONS.md`, `PROJECT.md`

---
*Atualizado em 2026-10-30 via PUCP. Handoffs anteriores preservados para referência.*