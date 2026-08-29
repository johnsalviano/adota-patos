<div align="center">

# 🐾 Adota Patos

**Plataforma web de adoção de animais da ONG Adota Patos — Patos, Paraíba**

[![CI](https://github.com/johnsalviano/adota-patos/actions/workflows/ci.yml/badge.svg)](https://github.com/johnsalviano/adota-patos/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg)](LICENSE)

</div>

---

## Sobre o projeto

A ONG Adota Patos cuida de animais de rua e organiza adoções responsáveis, mas
tudo era feito por stories e grupos de WhatsApp: solicitações perdidas em
comentários, respostas atrasadas e animais esperando mais do que deviam.

Este projeto resolve isso com um site público onde qualquer pessoa vê os animais
disponíveis e se candidata a adotar, e uma área administrativa onde a equipe da
ONG cadastra animais e acompanha as solicitações num lugar só.

> **Projeto de extensão universitária** — Atividades Práticas Interdisciplinares I,
> curso de Análise e Desenvolvimento de Sistemas (ADS), UNINASSAU Patos.
>
> | Papel | Quem |
> |---|---|
> | Back-end, banco de dados e segurança | [John Lennon Salviano Soares](https://github.com/johnsalviano) |
> | Front-end e protótipo visual | Matheus de Lima Eliziário |

## Funcionalidades

- **Catálogo público** — animais disponíveis com foto, história e botão "quero adotar";
- **Formulário protegido** — validação no navegador *e* no servidor, consentimento LGPD obrigatório;
- **Área da equipe** — login restrito aos membros autorizados pela ONG;
- **LGPD na prática** — banner de cookies, registro da versão do termo aceito e retenção limitada de dados.

## Segurança

Protegemos o sistema em camadas — se uma falhar, a próxima segura:

| Camada | Proteção |
|---|---|
| Borda | WAF Cloudflare (SQL injection e afins) |
| Aplicação | Validação de campos, honeypot anti-robô |
| Tráfego | Rate limit por IP **e** teto global |
| Banco | Row Level Security em todas as tabelas |
| Front-end | Escape de HTML (XSS não executa) |
| Origem | CORS restrito aos domínios oficiais |

A motivação e o detalhamento de cada decisão estão em
[docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md), seção *Segurança e LGPD — por que
cada decisão foi tomada*, incluindo as lições dos vazamentos reais do iFood
(dez/2025) e do Moltbook (fev/2026).

## Stack técnica

Escolhida com uma regra clara: **custo zero para a ONG**, hoje e sempre.

| Camada | Tecnologia | Por quê |
|---|---|---|
| Banco + auth + storage | [Supabase](https://supabase.com) (PostgreSQL) | Plano gratuito permanente e RLS nativa |
| Porta de entrada do formulário | Supabase Edge Functions (Deno) | Roda sem servidor próprio, sem custo fixo |
| Site público | HTML/CSS/JS puros e estáticos (sem build) | Simples de manter, rápido de carregar, separação total de estrutura/presentação/comportamento |
| Testes | [Playwright](https://playwright.dev) | Automatiza um navegador de verdade |

O agendador n8n foi descartado: a nuvem vira ~R$150/mês após o trial e a versão
local exigiria um PC ligado dia e noite.

## Estrutura do repositório

```
adota-patos/
├── REGRAS.md                  ← padrões obrigatórios de trabalho
├── backend/supabase/
│   ├── schema.sql             ← banco completo: tabelas, RLS, storage
│   ├── 002…005_*.sql          ← migrações incrementais
│   └── functions/receber-adocao/index.ts ← endpoint do formulário
├── docs/
│   ├── DOCUMENTACAO.md        ← documento vivo principal
│   ├── MODELO_CONCEITUAL.md   ← MER + dicionário de dados
│   └── diagramas/             ← diagrama entidade-relacionamento
├── frontend/
│   ├── index.html             ← site público (estrutura, escrita à mão)
│   ├── css/
│   │   ├── tema.css           ← variáveis de design (fonte única)
│   │   └── estilo.css         ← apresentação do site público
│   ├── js/app.js              ← comportamento do site público
│   ├── admin/                 ← login e painel da equipe
│   └── robots.txt
└── docs/arte-original/
    └── adota-patos.html       ← arte original do Matheus (referência visual)
```

## Como rodar localmente

Pré-requisitos: [Deno](https://deno.com) e conta no Supabase.

```bash
# 1. Clone e entre no projeto
git clone https://github.com/johnsalviano/adota-patos.git
cd adota-patos

# 2. Configure as variáveis de ambiente (sem valores reais no git!)
cp .env.example .env

# 3. Sirva o site publicamente
cd frontend && python -m http.server 8788
# abra http://localhost:8788

# 4. Rode a função do formulário localmente
supabase functions serve receber-adocao --env-file ./backend/supabase/.env
```

## Testes

As baterias de teste automatizam um navegador real (Playwright): fluxo de adoção,
banner de cookies, modal, limites de digitação, responsividade e tentativas de
invasão (SQL injection, rajada de envios, leitura por anônimo). A última bateria
técnica fechou **16/16** verificações e o pentest cobriu **12 vetores**.

> O versionamento dos scripts de teste no repositório está em andamento ([#7](https://github.com/johnsalviano/adota-patos/issues/7)).

## Documentação

Tudo está registrado em [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md):
decisões técnicas, modelagem do banco, pacote LGPD, auditorias e o diário de
desenvolvimento desde o primeiro dia. Para quem quer entender **por quê** de
cada escolha, comece por lá.

## Roadmap

- [ ] Domínio próprio e HTTPS
- [ ] Painel da ONG: CRUD de animais e aprovação de solicitações
- [ ] Google Search Console + sitemap.xml
- [ ] Sentry para monitorar erros em produção

## Contribuindo

Siga o guia em [CONTRIBUTING.md](CONTRIBUTING.md) — Issues antes de código,
Pull Requests para tudo. Questões de segurança: [SECURITY.md](SECURITY.md).

## Licença

[MIT](LICENSE) — use, estude e adapte livremente. Se ajudar outra ONG, ficamos felizes. 🐾
