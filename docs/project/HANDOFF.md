# HANDOFF.md — Como Continuar de Onde Parou (Adota Patos)

> Atualizado em 2026-10-30. Consolidado de `docs/HANDOFF-HERMES.md` e `docs/HANDOFF-OPENCODE.md` (2026-10-19). PUCP implementado.

## 1. Resumo executivo
- Site de adoção de animais em Patos-PB. Publicado em https://johnsalviano.github.io/adota-patos/ (GitHub Pages) — provisório até a VPS/domínio serem contratados.
- Página local de desenvolvimento: http://localhost:8080/ (ou 8788 para CORS).
- Branch atual: `main`. HEAD: `4e02599` (merge do PR #110). PR #113 aberto (deploy VPS).
- P0 resolvidos: "Lembrar-me" (sessão persistente + auto-preenchimento + auto-submit), `painel.js` fetch relativo → URL absoluta.
- P1 resolvidos: migrations 0004/0005/0006 aplicadas; Edge Functions `confirmar-doacao-monetaria` e `receber-doacao-monetaria` deployadas (ACTIVE).
- PUCP implementado (AGENTS.md + docs/project/).
- "Ver senha" removido por decisão de segurança (T-046 ADIADO).
- Testes E2E: 221 passed, 151 skipped, 0 failed.
- Deploy em VPS preparado (T-048): `deploy/vps/` com README, Caddyfile, deploy.sh; CORS com placeholder; gitignore global.

## 2. Estado real do repositório
- Branch: `main` (após merge do PR #110). HEAD: `4e02599`.
- Trabalho não commitado (in-progress): `REGRAS.md`, `frontend/css/estilo.css`, `frontend/index.html` (layout visual — preservar).
- PRs mergeados: #110 (PUCP + P0/P1), #111 (cobertura testes), #112 (RLS + edge cases).
- PR aberto: #113 (deploy VPS) — aguarda revisão/merge.
- Muitos arquivos untracked (migrations, Edge Functions, testes, seeds, schemas, deno.lock, handoffs antigos) — não commitados por decisão (são do projeto, mas não foram incluídos nos PRs).

## 3. Supabase
- Projeto remoto: https://fnlqruzbgwffhrqmpfvi.supabase.co
- Migrations aplicadas: até `20261017000006` (doacoes_monetarias). Todas as 22 migrations aplicadas.
- 10 tabelas públicas com RLS habilitado.
- 8 Edge Functions ACTIVE (receber-adocao, login-username, receber-doacao-alimento, receber-afiliacao, receber-doacao-outro, transparencia, confirmar-doacao-monetaria, receber-doacao-monetaria).
- `perfis_membros`: 2 registros (1 gerente, 1 colaborador).

## 4. Pendências conhecidas
1. (P2) Expandir cobertura de testes (T-039) — parcialmente concluído. Upload de transparência edge cases adicionais (opcional).
2. (P2) Revisar diff de `frontend/js/app.js` (T-038) — CONCLUÍDO.
3. (P2) Limpeza de artefatos (T-040) — CONCLUÍDO.
4. (P2) Preparar deploy VPS (T-048) — CONCLUÍDO (preparação). Aguardando contratação do domínio e VPS pela ONG.

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
- Nunca mascarar erros ou simular sucesso (política de integridade técnica).

## 6. Plano recomendado para retomar (deploy VPS)
1. Quando a ONG contratar o domínio e a VPS, seguir `deploy/vps/README.md`.
2. Descomentar a linha do domínio em todos os `cors.ts` (10 arquivos).
3. Redeployar as Edge Functions afetadas (via Supabase MCP ou CLI).
4. Ajustar o `Caddyfile` (trocar `SEU-DOMINIO.com.br` pelo domínio real).
5. Rodar `deploy.sh root@IP-DA-VPS`.
6. Verificar com o checklist do guia.

## 7. Ações proibidas
- Não fazer commit, push, merge, deploy ou publicação sem autorização.
- Não restaurar arquivos inteiros de commits antigos sem `git diff`.
- Não alterar banco de produção nem rodar migrations no Supabase sem autorização.
- Não criar animais fictícios em produção.
- Não expor credenciais/tokens/segredos.
- Não matar processos do Chrome do usuário.
- Não declarar localhost corrigido sem validação visual real.
- Não tratar site publicado como prova de alterações locais.

## 8. Incertezas restantes
- Diff de `frontend/js/app.js` (working tree) foi restaurado para versão limpa de `origin/main` + correção de emoji mojibake.
- Layout local não validado visualmente pelo responsável após correções (T-037 validado via CDP, mas não pelo responsável).
- CDP travou/não expôs targets de `github.io` durante investigação anterior.

## 9. Referências
- `docs/HANDOFF-HERMES.md` (preservado, atualizado)
- `docs/HANDOFF-OPENCODE.md` (preservado)
- `REGRAS.md`, `docs/DOCUMENTACAO.md`, `docs/MODELO_CONCEITUAL.md`
- `STATE.md`, `TASKS.md`, `ROADMAP.md`, `DECISIONS.md`, `PROJECT.md`
- `deploy/vps/README.md` (guia de deploy VPS)

---
*Atualizado em 2026-10-30 via PUCP. Handoffs anteriores preservados para referência.*