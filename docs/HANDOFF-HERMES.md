# ADOTA PATOS — HANDOFF TÉCNICO PARA CONTINUIDADE (HERMES)

**Data de criação:** 2026-10-19 (atualizado 2026-10-30)
**Repositório:** `C:\Users\johns\OneDrive\Documentos\Default Project\adota-patos`
**Branch atual:** `main` (após merge do PR #110, #111, #112). HEAD: `4e02599` (PR #113 aberto).
**Status:** P0 e P1 resolvidos; PUCP implementado; testes E2E 221 passed; deploy em VPS preparado.

## 1. Resumo Executivo

- Site de adoção de animais em Patos-PB. Publicado em https://johnsalviano.github.io/adota-patos/ (GitHub Pages, provisório).
- Página local: http://localhost:8080/ (ou 8788 para CORS).
- Backend: Supabase (https://fnlqruzbgwffhrqmpfvi.supabase.co) — DB, Auth, Edge Functions, Storage. Permanece no Supabase (não muda com VPS).
- P0 resolvidos: "Lembrar-me" (sessão persistente + auto-preenchimento + auto-submit), `painel.js` fetch relativo → URL absoluta.
- P1 resolvidos: migrations 0004/0005/0006 aplicadas; Edge Functions `confirmar-doacao-monetaria` e `receber-doacao-monetaria` deployadas (ACTIVE).
- PUCP implementado: `AGENTS.md` + `docs/project/` (PROJECT, TASKS, ROADMAP, STATE, DECISIONS, HANDOFF, history) com checklist de 48+ tarefas.
- "Ver senha" removido por decisão de segurança (T-046 ADIADO).
- Testes E2E: 221 passed, 151 skipped, 0 failed.
- Deploy em VPS preparado (T-048): `deploy/vps/` com README, Caddyfile, deploy.sh; CORS com placeholder; gitignore global.
- PRs mergeados: #110, #111, #112. PR #113 aberto (deploy VPS).

## 2. Estado real do repositório

- Branch: `main`. HEAD: `4e02599`.
- Trabalho não commitado (in-progress): `REGRAS.md`, `frontend/css/estilo.css`, `frontend/index.html` (layout visual — preservar, não commitar).
- Muitos arquivos untracked (migrations, Edge Functions, testes, seeds, schemas, deno.lock, handoffs antigos) — não commitados por decisão.

## 3. Supabase

- Projeto remoto: https://fnlqruzbgwffhrqmpfvi.supabase.co
- Migrations aplicadas: até `20261017000006` (doacoes_monetarias). Todas as 22 migrations aplicadas.
- 10 tabelas públicas com RLS habilitado.
- 8 Edge Functions ACTIVE.
- `perfis_membros`: 2 registros (1 gerente, 1 colaborador).

## 4. Regras permanentes de trabalho

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

## 5. Plano recomendado para retomar (deploy VPS)

1. Quando a ONG contratar o domínio e a VPS, seguir `deploy/vps/README.md`.
2. Descomentar a linha do domínio em todos os `cors.ts` (10 arquivos).
3. Redeployar as Edge Functions afetadas (via Supabase MCP ou CLI).
4. Ajustar o `Caddyfile` (trocar `SEU-DOMINIO.com.br` pelo domínio real).
5. Rodar `deploy.sh root@IP-DA-VPS`.
6. Verificar com o checklist do guia.

## 6. Ações proibidas

- Não fazer commit, push, merge, deploy ou publicação sem autorização.
- Não restaurar arquivos inteiros de commits antigos sem `git diff`.
- Não alterar banco de produção nem rodar migrations no Supabase sem autorização.
- Não criar animais fictícios em produção.
- Não expor credenciais/tokens/segredos.
- Não matar processos do Chrome do usuário.
- Não declarar localhost corrigido sem validação visual real.
- Não tratar site publicado como prova de alterações locais.

## 7. Referências

- `AGENTS.md` (regras operacionais do projeto)
- `REGRAS.md` (padrões obrigatórios)
- `docs/DOCUMENTACAO.md` (documento vivo principal)
- `docs/MODELO_CONCEITUAL.md` (modelagem de dados)
- `docs/project/STATE.md`, `TASKS.md`, `ROADMAP.md`, `DECISIONS.md`, `PROJECT.md`, `HANDOFF.md`
- `deploy/vps/README.md` (guia de deploy VPS)
- PRs: #110 (merged), #111 (merged), #112 (merged), #113 (aberto)

---
*Atualizado em 2026-10-30 para continuidade com Hermes.*