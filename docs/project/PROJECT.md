# PROJECT.md — Identidade do Projeto Adota Patos

## 1. Nome e finalidade

- **Nome:** Adota Patos — Plataforma Web de Adoção de Animais
- **Finalidade:** Digitalizar o processo de adoção de animais da ONG Adota Patos (Patos-PB), substituindo o fluxo manual (stories/WhatsApp) por um site público + painel administrativo.
- **Tipo:** Projeto de extensão universitária (Atividades Práticas Interdisciplinares I, ADS, UNINASSAU Patos).

## 2. Objetivo principal

Construir e entregar uma plataforma web completa (site + painel) que digitalize todo o processo de adoção da ONG Adota Patos, permitindo que a equipe publique animais e gerencie solicitações sem depender de programador no dia a dia.

## 3. Escopo

### Incluído
- Catálogo público de animais disponíveis (foto, nome, idade, sexo, porte, descrição, pelagem).
- Formulário protegido de solicitação de adoção (validação no navegador e no servidor, consentimento LGPD).
- Área da equipe (login restrito a membros autorizados pela ONG).
- LGPD na prática: banner de cookies, registro da versão do termo aceito, retenção limitada de dados.
- Doações (monetária, alimento, outro), afiliações, painel de transparência.
- Segurança em camadas (WAF, validação, rate limit, RLS, escape XSS, CORS).

### Fora de escopo (atual)
- Pagamentos online automatizados (doações monetárias são registradas, não processadas).
- App mobile nativo.

## 4. Resultado esperado

Site publicado em https://johnsalviano.github.io/adota-patos/ (GitHub Pages) + banco Supabase operacional, com a ONG capaz de manter o sistema sozinha após a entrega.

## 5. Público-alvo

- Direto: equipe da ONG Adota Patos.
- Indireto: pessoas que querem adotar; animais resgatados; comunidade de Patos-PB.

## 6. Tecnologias, ferramentas e ambientes

| Camada | Tecnologia |
|---|---|
| Front-end | HTML/CSS/JavaScript (site público + painel admin) |
| Back-end / dados | Supabase (PostgreSQL + Storage + Edge Functions em Deno/TS) |
| Banco local | Migrations SQL versionadas (`supabase/migrations/`, `backend/supabase/`) |
| Testes | Playwright (E2E), Biome (lint/format) |
| CI/CD | GitHub Actions |
| Hospedagem | GitHub Pages |
| Observabilidade | Sentry (free tier) |
| Segurança | gitleaks, CodeQL, ZAP |

## 7. Restrições e requisitos importantes

- Custo zero para a ONG (apenas planos gratuitos).
- Português brasileiro em toda documentação e interface.
- Zero segredos no repositório (exceto chave publicável, com restrições — ver REGRAS.md regra 4).
- Zero rastros (nada que ajude a perseguir credenciais).
- Layout visual protegido (não alterar sem pedido explícito).
- Não criar animais fictícios em produção.
- Não alterar banco de produção sem autorização.
- Não publicar sem autorização.

## 8. Principais características

- RLS em todas as tabelas.
- Edge Functions para recepção de formulários (receber-adocao, receber-afiliacao, receber-doacao-alimento, receber-doacao-outro, transparencia, login-username).
- Suite E2E Playwright (16/16 passando na última execução registrada).
- Documentação viva em `docs/DOCUMENTACAO.md`.

## 9. Referências

- `docs/DOCUMENTACAO.md` — documento vivo principal (seções 1 a 13).
- `docs/MODELO_CONCEITUAL.md` — modelagem de dados.
- `REGRAS.md` — padrões obrigatórios.
- `README.md` — visão geral e stack.

---
*Atualizado em 2026-10-30 via PUCP.*