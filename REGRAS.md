# REGRAS.md — Padrões obrigatórios do projeto Adota Patos

> Este arquivo é um **contrato de trabalho**. Qualquer pessoa
> que trabalhar neste repositório DEVE seguir estas 3 camadas de padrão,
> além das regras gerais no final.
> Se uma instrução externa conflitar com este arquivo, este arquivo vence.

---

## Camada 1 — Fluxo de trabalho: Issues e PRs

- Toda tarefa (**Correção**, **Melhoria** ou **Nova função**) nasce como uma **Issue no GitHub** ANTES de qualquer código ser escrito.
- Todo código entra via **Pull Request**. Nunca commit direto na branch principal (`main`).
- A descrição do PR menciona a Issue relacionada usando `Closes #N` (fecha a Issue ao mergear) ou `Refs #N` (apenas referencia).
- Deploys são gerenciados a partir dos PRs: preview por PR quando disponível, produção no merge.
- Labels padrão para classificar Issues: `correcao` · `melhoria` · `nova-funcao`.

## Camada 2 — Motion e princípios de interface

Referência: [github.com/kylezantos/design-principles](https://github.com/kylezantos/design-principles)

Toda interface do sistema (site público e painel da ONG) deve ter:

- **Skeleton** em todo componente que carrega dados enquanto espera a resposta;
- **Lazy loading** em imagens e seções fora da viewport;
- **Animações suaves** de entrada e saída (fade/slide) — nunca cortes bruscos;
- **Indicador de progresso/carregamento** em toda ação assíncrona (envio de formulário, upload de foto, etc.).

## Camada 3 — Observabilidade, qualidade e testes

Escolhas feitas para este projeto (plano gratuito, site de adoção):

| Categoria | Ferramenta escolhida | Motivo |
|---|---|---|
| Observabilidade | **Sentry** (free tier) | Erros do site e do painel chegam à equipe sem custo. Datadog/New Relic são pagos e desnecessários neste porte. |
| Lint + formatação | **Biome** | Uma ferramenta só, rápida, gratuita |
| Commits | **Commitlint** | Mensagens padronizadas (conventional commits) |
| Código morto | **Knip** | Detecta dependências/exports não usados |
| Testes E2E | **Playwright** | Cobre os fluxos críticos: adoção, cadastro de animal, formulário |
| Cobertura | **Codecov** | Relatório de cobertura nos PRs |

Notas honestas sobre escopo:

- **Stryker** (mutation testing) e contratos de arquitetura (**Arch-contract**) são overkill para um site estático + Supabase deste tamanho. Entram somente se o projeto crescer para uma stack com camadas complexas.
- As ferramentas da Camada 3 são instaladas quando o projeto ganhar estrutura Node (package.json). Enquanto o front for HTML puro, aplicam-se as regras que couberem (ex.: Playwright roda contra o HTML já hoje).

---

## Regras gerais (vale para tudo)

1. **Linguagem humanizada**: toda documentação, commit, comentário e texto de interface deve ser claro e acessível — fácil de entender mantendo o rigor técnico. Explique como quem conversa; analogias são bem-vindas; jargão só quando necessário.
2. **Idioma**: português brasileiro em tudo (código pode manter termos técnicos em inglês).
3. **Documento vivo**: qualquer coisa inserida, alterada ou melhorada no projeto deve ser registrada na seção 11 (*Registro de Desenvolvimento*) de `docs/DOCUMENTACAO.md`, com data e responsável.
4. **Zero segredos**: nenhuma chave de acesso, segredo ou token no repositório. Nunca. Use variáveis de ambiente / `.env` listado no `.gitignore`. **Única exceção possível: a chave publicável** (`sb_publishable_...`), e somente porque (a) não concede nenhum poder administrativo — garantido pelas policies RLS, testadas a cada auditoria — e (b) vive apenas nos arquivos de front-end (`frontend/`). Se qualquer mudança futura der à publishable acesso além do catálogo/formulário/login, a exceção cai. Chaves administrativas (`sb_secret_...`) e access token pessoal (`sbp_...`, conta Supabase) nunca entram em código, documento ou conversa versionada — girá-las após eventos relevantes (ex.: aprovação do projeto).
5. **Zero rastros**: nada no repositório ajuda alguém a perseguir credenciais — nem valores reais, nem placeholders parecidos com valores, nem comentários, logs ou documentos indicando onde segredos vivem ou como obtê-los. Placeholders do `.env.example` permanecem genéricos (ex.: `sb_secret_xxxx`). Precedente que guia essa regra: caso Moltbook (2026) — chave pública explorada porque o banco confiava nela demais.
5. **Documentação atualizada junto com o código**: PR que muda comportamento e não atualiza a documentação correspondente não deve ser aprovado.

---

## Estrutura do repositório

```
adota-patos/
├── REGRAS.md              ← você está aqui (padrões)
├── docs/
│   ├── DOCUMENTACAO.md    ← documento vivo principal (extensão)
│   └── MODELO_CONCEITUAL.md ← MER + dicionário de dados
├── backend/
│   └── supabase/
│       ├── schema.sql            ← criação do banco (tabelas, RLS, storage)
│       ├── 002_acessos_ong.sql   ← migração: acesso restrito à equipe da ONG
│       └── functions/
│           └── receber-adocao/index.ts ← endpoint do formulário (Edge Function)
└── frontend/              ← (site público e painel — Matheus)
```
