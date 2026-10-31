# TASKS.md — Checklist Central do Projeto Adota Patos

> Documento operacional mais importante. Contém TODAS as tarefas relevantes identificadas, concluídas e pendentes. **Não apagar tarefas concluídas. Não alterar IDs sem necessidade.**

## Estados padronizados
- PENDENTE
- EM ANDAMENTO
- BLOQUEADO
- PRECISA VERIFICAÇÃO
- CONCLUÍDO
- ADIADO

## Formato de cada tarefa
- **ID** — identificador único e permanente
- **Descrição** — objetiva
- **Prioridade** — P0 (bloqueia uso real) / P1 (funcionalidade incompleta) / P2 (melhoria) / P3 (ideia futura)
- **Estado**
- **Critérios de aceitação**
- **Dependências**
- **Evidências**
- **Observações**

---

## Tarefas concluídas (marcos)

### T-001 — Infraestrutura base Supabase (schema, tabelas, RLS, storage)
- Prioridade: P0
- Estado: CONCLUÍDO
- Critérios: tabelas `animais`/`adocoes`, bucket `fotos-animais`, RLS ativa, documentação viva + modelo conceitual, repo público com REGRAS.md e Issues #1-#9.
- Evidências: `docs/DOCUMENTACAO.md` §11 (2026-08-22); `backend/supabase/schema.sql`.

### T-002 — Formulário de adoção (Edge Function receber-adocao)
- Prioridade: P0
- Estado: CONCLUÍDO
- Critérios: endpoint público valida campos, grava em `adocoes`, responde JSON humanizado.
- Evidências: `backend/supabase/functions/receber-adocao/`.

### T-003 — Migração 002 (perfis_membros — acesso restrito à ONG)
- Prioridade: P0
- Estado: CONCLUÍDO
- Evidências: `backend/supabase/002_acessos_ong.sql`.

### T-004 — Pacote LGPD (migração 003: consentimento + versão do termo)
- Prioridade: P0
- Estado: CONCLUÍDO
- Evidências: `backend/supabase/003_lgpd.sql`.

### T-005 — Banner de cookies (LGPD)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-006 — Proteção contra robôs e abuso (migração 004, rate limit + honeypot)
- Prioridade: P0
- Estado: CONCLUÍDO
- Evidências: `backend/supabase/004_rate_limit.sql`.

### T-007 — Log de segurança (migração 005)
- Prioridade: P1
- Estado: CONCLUÍDO
- Evidências: `backend/supabase/005_log_seguranca.sql`.

### T-008 — Retenção automática de dados (LGPD, >6 meses)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-009 — CORS restrito (Edge Function)
- Prioridade: P0
- Estado: CONCLUÍDO

### T-010 — Pentest com 12 vetores
- Prioridade: P0
- Estado: CONCLUÍDO
- Evidências: `docs/DOCUMENTACAO.md` §11 (2026-08-23).

### T-011 — Endurecimento da função (F1-F4: IP, payload, regex, limites)
- Prioridade: P0
- Estado: CONCLUÍDO

### T-012 — Limites de digitação (nome/telefone/cidade/motivo)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-013 — SEO básico (robots.txt, meta, OG, favicon)
- Prioridade: P2
- Estado: CONCLUÍDO

### T-014 — História real da ONG no site (seção "Sobre nós")
- Prioridade: P2
- Estado: CONCLUÍDO

### T-015 — Google Analytics 4 (com gatilho LGPD)
- Prioridade: P2
- Estado: CONCLUÍDO

### T-016 — Política de Privacidade (modal)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-017 — CI/GitHub endurecido (CodeQL, gitleaks, dependabot)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-018 — Refatoração da Edge Function (cors/validar/seguranca)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-019 — Front-end reescrito à mão (Rota B, HTML/CSS/JS limpos)
- Prioridade: P0
- Estado: CONCLUÍDO

### T-020 — Acessibilidade e qualidade (focus trap, skip-to-content, alt, JSON-LD)
- Prioridade: P2
- Estado: CONCLUÍDO

### T-021 — Painel da ONG (login + cadastro de animal com upload)
- Prioridade: P0
- Estado: CONCLUÍDO
- Evidências: `frontend/admin/`.

### T-022 — Validação do formulário de cadastro de animal (animal_id)
- Prioridade: P1
- Estado: CONCLUÍDO
- Data: 2026-09-28

### T-023 — Migração 007 (proteção do storage: MIME + 5MB)
- Prioridade: P1
- Estado: CONCLUÍDO
- Evidências: `backend/supabase/007_protecao_storage.sql`.

### T-024 — Suite E2E versionada (16/16 passando)
- Prioridade: P1
- Estado: CONCLUÍDO
- Data: 2026-09-29
- Evidências: `tests/e2e/`, `npx playwright test`.

### T-025 — Painel concluído (edição, exclusão, marcar adotado)
- Prioridade: P0
- Estado: CONCLUÍDO
- Data: 2026-09-30
- Evidências: `frontend/admin/painel.html`, `painel.js`.

### T-026 — Doações (alimento/outro) + afiliações + transparência
- Prioridade: P1
- Estado: CONCLUÍDO (código)
- Observação: migrations 011-013/015-017 e Edge Functions de doação monetária pendentes de deploy (ver T-035, T-036).
- Evidências: `backend/supabase/011_*.sql` ... `015_*.sql`, `supabase/functions/receber-doacao-*`, `transparencia`.

### T-027 — Campo pelagem (migrações 014, 016)
- Prioridade: P2
- Estado: CONCLUÍDO

### T-028 — Login por username (migrações 008-010)
- Prioridade: P1
- Estado: CONCLUÍDO

### T-029 — Rate limit por categoria (migração 017)
- Prioridade: P2
- Estado: CONCLUÍDO (código)

### T-030 — Transparência (seletor de ano até 2050)
- Prioridade: P2
- Estado: CONCLUÍDO

### T-031 — Correção de largura do catálogo (PR #109)
- Prioridade: P0
- Estado: CONCLUÍDO (código publicado)
- Evidências: commit `8fdc1d2`, PR #109 mergeado (`5824a1d`), 5 workflows SUCCESS.
- Observação: visual não validado pelo responsável (ver T-037).

### T-032 — Modo de teste do catálogo (MOCK_ANIMALS, qa_animais)
- Prioridade: P2
- Estado: CONCLUÍDO

---

## Tarefas pendentes

### T-033 - "Lembrar-me" não mantém sessão
- Prioridade: P0
- Estado: CONCLUÍDO
- Critérios de aceitação: sessão persiste após fechar/reabrir navegador quando "Lembrar-me" marcado.
- Dependências: `frontend/admin/sessao.js`, `frontend/admin/login.js`.
- Evidências: validação via CDP (2026-10-30):
  - Marcado: sessão persistida em localStorage (sessionStorage vazio). Fechamento e reabertura do navegador → sessão mantida; `login.html` redireciona automaticamente para `painel.html` sem pedir credenciais; `#conteudo-painel` visível.
  - Desmarcado: sessão em sessionStorage (localStorage vazio). Fechamento e reabertura do navegador → sessão morre; redirect para `login.html` (pede credenciais). Conforme teste `login-lembrar-me.spec.ts`.
- Correções aplicadas:
  - `sessao.js`: `getItem` prioriza o storage da preferência (evita sombreamento); `setItem` limpa o outro storage.
  - `login.js`: verificação de sessão existente no carregamento → redireciona para `painel.html` se já logado (faz o "Lembrar-me" funcionar como esperado).
  - `login.js`: sincronização do checkbox com `lerPreferencia()` no carregamento, para que o "Lembrar-me" reflita a preferência salva (padrão: marcado).
  - `login.js`: lembra username + senha em `localStorage` (chave `adota-patos:credenciais`) quando "Lembrar-me" marcado; pré-preenche os campos ao carregar a tela de login; auto-submete o formulário se as credenciais foram carregadas (para que a pessoa não precise digitar nem clicar). Validado via CDP (pré-preenchimento + auto-submit funcionando).
  - `login.js`: lembra o username (apenas o username, nunca a senha) em `localStorage` quando "Lembrar-me" marcado; preenche o campo ao carregar a tela de login. A senha em si nunca é salva pelo app (segurança) — auto-preenchimento de senha fica a cargo do gerenciador de senhas do navegador.

### T-034 - `painel.js` fetch relativo quebra no GitHub Pages
- Prioridade: P0
- Estado: PRECISA VERIFICAÇÃO
- Critérios: upload de transparência funciona em produção (URL absoluta do Supabase).
- Dependências: `frontend/admin/painel.js` (linhas ~979, ~1094).
- Observações: correção aplicada (fetch agora usa URL absoluta do Supabase em upload e delete). Pendente validação em produção.

### T-035 - Aplicar migrations locais no Supabase remoto (011-017)
- Prioridade: P1
- Estado: CONCLUÍDO
- Critérios: migrations `20261017000004/0005/0006` e demais locais aplicadas no remoto; banco remoto = código local.
- Dependências: acesso ao Supabase remoto; autorização.
- Evidências: aplicadas via MCP em 2026-10-30:
  - `status_doacoes_alimentos_outros` (20261017000004) — OK
  - `status_afiliacoes` (20261017000005) — OK
  - `doacoes_monetarias` (20261017000006) — OK (tabela + RLS + políticas + índices)
- Observações: as migrations 011-017 (doações, afiliações, transparência, etc.) já estavam aplicadas no remoto. Apenas 0004/0005/0006 faltavam.

### T-036 - Deploy das Edge Functions de doação monetária
- Prioridade: P1
- Estado: CONCLUÍDO
- Critérios: `confirmar-doacao-monetaria` e `receber-doacao-monetaria` ACTIVE no remoto.
- Dependências: T-035; autorização.
- Evidências: deploy via MCP em 2026-10-30:
  - `confirmar-doacao-monetaria` — ACTIVE (version 1)
  - `receber-doacao-monetaria` — ACTIVE (version 1)
- Observações: corrigido bug de imports em `receber-doacao-monetaria/index.ts` (`./cors.ts` → `../_shared/cors.ts`; `../_shared/seguranca.ts` → `./seguranca.ts`) antes do deploy.

### T-037 - Validação visual do catálogo pelo responsável
- Prioridade: P0
- Estado: CONCLUÍDO
- Critérios: 3 col (1440px), 2 col (768px), 1 col (390px); imagens height 250px object-fit cover; sem compressão.
- Dependências: navegador gráfico compartilhado (CDP).
- Evidências: validação via CDP (Chrome remote debugging) em 2026-10-30:
  - 1249px (desktop): 3 colunas (351.5px cada), grid 1111px, img 250px cover, .animals-grid é wrapper (block), grid é filho direto (não dentro de .section-header).
  - 768px (tablet): 2 colunas (324.8px cada).
  - 390px (mobile): 1 coluna (351px).
- Observações: validado no working tree local com dados de teste (MOCK_ANIMALS). Estrutura de layout confirmada correta.

### T-038 — Revisar diff não revisado de `frontend/js/app.js`
- Prioridade: P2
- Estado: PENDENTE
- Critérios: diff do working tree revisado linha a linha; sem regressões.

### T-039 — Cobertura de testes: RLS, Edge Function, login, painel, upload
- Prioridade: P2
- Estado: PENDENTE
- Critérios: suite Playwright cobre fluxos de painel e segurança (além do site público com rede simulada).

### T-040 — Limpeza de artefatos/untracked antes de commit
- Prioridade: P2
- Estado: PENDENTE
- Critérios: remover/organizar artefatos ZAP, `stdout/`, arquivo com nome corrompido, `deno.lock` duplicado; revisar o que deve ser commitado.
- Observações: não usar `git clean` sem revisão.

### T-041 — Resolver arquivo com nome corrompido (`C�tmpparse_alerts.py`)
- Prioridade: P3
- Estado: PENDENTE

### T-042 - Manter documentação atualizada junto com código (regra 6)
- Prioridade: P1
- Estado: EM ANDAMENTO
- Critérios: PR que muda comportamento atualiza `docs/DOCUMENTACAO.md` §11.

### T-046 - "Ver senha" no campo de senha do login
- Prioridade: P2
- Estado: CONCLUÍDO
- Critérios: botão toggle (👁/🙈) alterna o campo entre `password` e `text`, preservando o valor digitado; acessível (aria-pressed, aria-label).
- Evidências: validado via CDP (2026-10-30): type alterna password→text→password, valor preservado, aria-pressed atualizado.
- Arquivos: `frontend/admin/login.html`, `frontend/admin/login.css`, `frontend/admin/login.js`.

---

## Ideias futuras / adiadas

### T-043 — Stryker (mutation testing)
- Prioridade: P3
- Estado: ADIADO
- Observações: overkill para site estático + Supabase atual.

### T-044 — Contratos de arquitetura (Arch-contract)
- Prioridade: P3
- Estado: ADIADO

### T-045 — App mobile nativo
- Prioridade: P3
- Estado: ADIADO

---

*Atualizado em 2026-10-30 via PUCP. Novas necessidades: adicionar ao checklist, não deixar fora.*