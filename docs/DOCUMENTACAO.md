# 🐾 Adota Patos — Documentação do Projeto

> **Documento vivo.** Tudo que a gente inserir, mudar ou melhorar deve ser registrado aqui.
> Regra de ouro: **fez algo novo no projeto? Atualize este documento** (seção 11 — Registro de Desenvolvimento).

---

## 1. Identificação do Projeto

| Campo | Informação |
|---|---|
| **Título** | Adota Patos — Plataforma Web de Adoção de Animais |
| **Área temática** | Tecnologia (com impacto social em bem-estar animal e comunidade) |
| **Modalidade de extensão** | Prestação de Serviço / Voluntariado tecnológico |
| **Equipe** | John Lennon Salviano Soares (back-end: banco, integrações, automações) • Matheus de Lima Eliziário (front-end: site público e painel da ONG) |
| **Instituição** | UNINASSAU — Centro Universitário • Curso: Análise e Desenvolvimento de Sistemas (ADS) |
| **Disciplina** | Atividades Práticas Interdisciplinares de Extensão I |
| **Período de execução** | Início de agosto/2026 – em andamento |

---

## 2. Introdução e Justificativa

Toda semana, em Patos-PB, animais são abandonados ou vivem nas ruas dependendo da boa vontade de protetores independentes. A ONG **Adota Patos** trabalha resgatando esses animais, cuidando deles e buscando pessoas dispostas a adotar.

O problema que a ONG enfrenta é quase todo manual: os animais disponíveis são divulgados em stories e grupos de WhatsApp, as solicitações de adoção chegam espalhadas por comentários e mensagens privadas, e ninguém consegue responder rápido quem demonstrou interesse. O resultado é conhecido: **animal demora a ser adotado, adotante desiste no meio do caminho e a ONG afoga em mensagens.**

Este projeto resolve isso com tecnologia simples e gratuita:

- Um **site público**, onde qualquer pessoa vê os animais disponíveis e se candidata a adotar em um formulário;
- Um **painel administrativo**, onde a ONG cadastra animais, publica fotos, marca adoções concretizadas e acompanha todas as solicitações num lugar só;
- Uma esteira automática nos bastidores: quando alguém preenche o formulário, os dados **chegam sozinhos** no banco de dados da ONG, sem ninguém precisar copiar e colar nada.

O impacto social está no elo mais fraco que a tecnologia fortalece: **quanto mais rápido um animal aparece para o adotante certo, mais curta é a espera dele por um lar.** E quanto menos tempo a ONG gasta com trabalho administrativo repetitivo, mais tempo ela dedica aos animais.

O benefício alcança toda a cidade, não só os animais e adotantes: **cada adoção responsável é um animal a menos nas ruas**, o que significa menos risco de atropelamentos em vias movimentadas, menos possibilidade de ataques a pedestres — especialmente crianças e idosos — e menos circulação de doenças transmitidas por animais sem cuidados. A plataforma, portanto, contribui indiretamente para a **segurança e a saúde pública de Patos**, enquanto promove a convivência mais humana entre pessoas e animais.

> Em uma frase: **usamos o que aprendemos no curso para transformar o fluxo de adoção de uma ONG real, de graça, de forma que eles consigam manter sozinhos depois.**

---

## 3. Objetivos

### Objetivo geral
Construir e entregar uma plataforma web completa (site + painel) que digitalize todo o processo de adoção da ONG Adota Patos, permitindo que a equipe publique animais e gerencie solicitações **sem depender de programador** para o dia a dia.

### Objetivos específicos
1. Exibir publicamente os animais disponíveis, com foto, nome, idade, sexo, porte e descrição;
2. Receber solicitações de adoção por formulário web, salvando tudo automaticamente no banco de dados;
3. Dar à ONG um painel protegido por login para cadastrar, editar, excluir e marcar animais como "Adotado";
4. Centralizar as solicitações de adoção para a ONG visualizar e avaliar;
5. Usar apenas ferramentas com plano gratuito (Supabase e seus recursos incluídos), tornando o projeto **sustentável sem custo fixo**;
6. Documentar tudo em linguagem acessível, para que qualquer pessoa da ONG (ou outro aluno) consiga entender e dar manutenção.

---

## 4. Caracterização da Área / Localidade

O projeto atende a ONG **Adota Patos**, sediada em **Patos, sertão da Paraíba**. A região convive com alto índice de abandono de cães e gatos, e o trabalho dos protetores depende de divulgação voluntária. A plataforma tem alcance imediato na cidade e região, mas funciona em qualquer lugar com internet — podendo servir de modelo para outras ONGs.

---

## 5. Locais de Execução, Público-Alvo e Parcerias

| Item | Detalhe |
|---|---|
| **Local de execução** | Remoto (desenvolvimento) + ONG Adota Patos (implantação e treinamento) |
| **Público-alvo direto** | Equipe da ONG Adota Patos |
| **Público-alvo indireto** | Pessoas que querem adotar; animais resgatados; comunidade de Patos-PB |
| **Parcerias** | ONG Adota Patos (fornecimento de conteúdo, fotos reais e validação do processo) |

---

## 6. Materiais e Métodos

### 6.1 Ferramentas utilizadas (todas com plano gratuito)

| Ferramenta | Papel no projeto | Por quê essa |
|---|---|---|
| **HTML/CSS/JavaScript** | Site público e painel da ONG | Roda em qualquer navegador, sem instalação |
| **Supabase** | Banco de dados + armazenamento das fotos | Gratuito, tem interface amigável, expõe API pronta |
| **Edge Function (Supabase)** | Recepcionista automático do formulário | Roda nos servidores do Supabase 24/7, incluída no plano gratuito — avaliamos o n8n Cloud, mas ele vira pago após o período de teste |
| **GitHub** | Guardar o código e histórico | Trabalho em dupla com versionamento |
| **Mermaid** | Diagramas desta documentação | Os diagramas são texto — fáceis de atualizar |

### 6.2 Como dividimos o trabalho

- **Matheus (front-end):** telas do site, telas do painel, experiência do usuário;
- **John (back-end):** modelagem do banco, segurança de acesso, endpoint serverless do formulário, integrações e esta documentação.

### 6.3 Método de trabalho

Trabalhamos em etapas curtas: primeiro o banco funcionando, depois o receptor do formulário, depois o site conectado. Cada etapa termina **testada e registrada** neste documento (seção 11). Toda tarefa vira uma Issue no GitHub e entra via Pull Request — assim fica rastro de quem fez o quê e por quê.

---

## 7. Arquitetura do Sistema — para que serve cada coisa

Aqui está o coração do projeto explicado sem mistério. São **três peças** trabalhando juntas:

```mermaid
flowchart LR
    V["👤 Visitante<br>(quer adotar)"] --> S["🌐 Site público<br>(catálogo + formulário)"]
    S -- "1. formulário preenchido" --> F["⚡ Função serverless<br>(recepcionista automática)"]
    F -- "2. anota no caderno" --> DB[("🗄️ Supabase<br>(banco de dados + fotos)")]
    O["🏢 ONG<br>(equipe com login)"] --> P["🖥️ Painel admin"]
    P -- "cadastra/edita/marca adotado" --> DB
    DB -- "3. site sempre atualizado" --> S
```

### As três peças, uma por uma

**1. Supabase — o "caderno oficial" da ONG.**
É onde moram TODAS as informações: os animais cadastrados, as fotos, as solicitações de adoção. O site lê daqui; o painel escreve aqui. Quando a ONG marca o Thor como "Adotado" no painel, é esse registro que muda — e o site para de mostrar o Thor na hora, porque ele sempre consulta o mesmo caderno.

**2. Site público — a vitrine.**
Qualquer pessoa acessa, vê os animais disponíveis, clica em "Quero adotar" e preenche o formulário. Ele não salva nada diretamente no banco: entrega o formulário para a recepcionista abaixo.

**3. Função serverless (`receber-adocao`) — a recepcionista automática.**
Quando o formulário chega, ela confere os campos com atenção (e avisa, com educação, o que está faltando), depois anota no "caderno" (Supabase), no capítulo certo (tabela `adocoes`). Por que não deixar o site gravar direto? **Segurança:** o site é público — se ele tivesse a chave para gravar no banco, qualquer pessoa mal-intencionada poderia usar essa chave. Com a recepcionista no meio, o banco só aceita escrita de solicitações vindas dela.

> 💡 **Por que não usamos o n8n?** Avaliamos essa ferramenta no planejamento, mas o serviço em nuvem vira pago após o período de teste (~R$150/mês) e hospedar em casa exigiria um computador ligado 24 horas. A função serverless do próprio Supabase faz o mesmo papel, já está incluída no plano gratuito e nunca dorme. Decisão registrada na seção 11.

### O caminho de cada ação

| O que acontece | Caminho |
|---|---|
| ONG cadastra o Thor | Painel → Supabase → Thor já aparece no site |
| ONG marca Thor como Adotado | Painel → Supabase muda o status → some do catálogo |
| Visitante se candidata | Site → função `receber-adocao` → tabela `adocoes` → ONG vê no painel |
| Visitante vê animal | Site lê tabela `animais` (só os Disponíveis) |

---

## 8. Modelagem de Dados (resumo)

O detalhamento completo — entidades, atributos, relacionamentos, cardinalidades e dicionário de dados — está no documento dedicado:

📄 **[MODELO_CONCEITUAL.md](./MODELO_CONCEITUAL.md)**

Em resumo, guardamos duas "fichas":

- **`animais`** — a ficha de cada animal (nome, idade, sexo, porte, foto, descrição e status: *Disponível* ou *Adotado*);
- **`adocoes`** — a ficha de cada candidato a adotante (dados de contato, experiência com animais, motivo) ligada ao animal pretendido.

Um animal pode receber **várias** solicitações; cada solicitação aponta para **um** animal (ou fica órfã se o animal for removido).

---

## 9. Resultados Esperados

1. Catálogo online sempre atualizado, eliminando a divulgação fragmentada em redes sociais;
2. Redução do esforço administrativo da ONG (sem copiar/colar dados de mensagens);
3. Todas as solicitações centralizadas, com data e contato do interessado;
4. ONG autônoma: capaz de gerenciar tudo sozinha após treinamento;
5. Projeto replicável: outra ONG pode clonar a ideia com custo zero.

**Indicadores de sucesso:** número de animais cadastrados pela própria ONG; número de solicitações recebidas pelo site; tempo médio entre solicitação e resposta da ONG.

---

## 10. Cronograma

| Etapa | O que acontece | Status |
|---|---|---|
| 1. Planejamento e pesquisa | Definição do escopo, referências e ferramentas | ✅ Concluída |
| 2. Protótipo do site | Matheus monta o layout do site público | ✅ Concluída |
| 3. Banco de dados | Criação do projeto Supabase, tabelas e storage | ✅ Concluída |
| 4. Receptor do formulário | Endpoint serverless (`receber-adocao` → Supabase) | ✅ Concluída |
| 5. Integração do site | Formulário enviando ao webhook; catálogo lendo o banco | ⏳ Pendente |
| 6. Painel da ONG | Login, CRUD de animais, lista de solicitações | ⏳ Pendente |
| 7. Testes completos | Fluxo inteiro ponta a ponta | ⏳ Pendente |
| 8. Implantação e treinamento | Colocar no ar e treinar a equipe da ONG | ⏳ Pendente |
| 9. Relatório final | Fechamento da documentação para entrega | ⏳ Pendente |

---

## 11. Registro de Desenvolvimento

> **Regra do projeto: cada coisa que entrarmos ou melhorarmos ganha uma linha aqui.** E o nosso diario de bordo — serve para o relatorio final da extensao e para lembrar decisoes.

| Data | O que foi feito |
|---|---|
| 2026-08-01 a 08-18 | **Fase de estudo e pesquisa**: levantamento de plataformas similares, comparacao entre ferramentas (Supabase, Firebase, n8n), estudo de RLS, LGPD e boas praticas de seguranca. Base teorica que orientou todas as decisoes seguintes |
| 2026-08-19 | Prototipo HTML do site publico entregue (layout completo: catalogo, modal, formulario, responsivo) |
| 2026-08-19 | Divisao formal do trabalho: back-end/banco/integracoes + front-end/painel da ONG |
| 2026-08-22 | **Infraestrutura base**: projeto Supabase criado, `schema.sql` executado (tabelas `animais`/`adocoes`, bucket `fotos-animais`, RLS ativa), documentacao viva + modelo conceitual, repositorio publico com `REGRAS.md` e Issues #1-#9 |
| 2026-08-22 | Testes de seguranca via API publica: visitante le catalogo (200), escrita anonima bloqueada (401) |
| 2026-08-22 | **Migracao 002** (`002_acessos_ong.sql`): lista `perfis_membros` — so e-mails autorizados pela ONG tem poderes administrativos. Defesa contra criacao de contas falsas |
| 2026-08-22 | **Decisao de arquitetura**: substituicao do n8n por Edge Function do Supabase. Motivo: n8n cobra ~R$150/mes apos o trial; a ONG exige custo zero |
| 2026-08-22 | **Formulario no ar** (#2): endpoint publico testado ponta a ponta — valida campos, grava em `adocoes`, responde em JSON humanizado |
| 2026-08-22 | Imagem do modelo conceitual na notacao de Peter Chen (`docs/diagramas/modelo-conceitual.png`, fonte `.dot`) |
| 2026-08-23 | **Integracao do prototipo ao back-end real**: criado `gerar_frontend.py`; correcao: coluna `criado_em` nao existia, corrigido para `created_at` |
| 2026-08-23 | **Vulnerabilidade XSS corrigida**: `innerHTML` sem tratamento permitia injecao via cadastro. Solucao: funcao de escape + URLs somente `https://` |
| 2026-08-23 | **Pacote LGPD** (Issues #13 e #18): migracao 003 adicionou `consentimento_lgpd` e `termo_versao`; formulario com autorizacao obrigatoria; Edge Function recusa sem consentimento (400) |
| 2026-08-23 | **Banner de cookies** (#15): aviso na primeira visita com Aceitar/Recusar; Google Analytics so carrega apos aceite |
| 2026-08-23 | **Protecao contra robos e abuso** (#16): migracao 004 criou tabela de controle + funcao atomica `registrar_envio`; limite 5 envios/min por IP, teto global 60/min; honeypot com resposta falsa |
| 2026-08-23 | **Teto global de rate limit**: IP pode ser forjado na cadeia XFF; o teto global garante protecao mesmo contra esse truque |
| 2026-08-23 | **Log de seguranca** (#19, migracao 005): tabela `log_seguranca` com evento/IP/detalhe tecnico; limpeza automatica aos 90 dias |
| 2026-08-23 | **Retencao automatica de dados** (#14): job diario remove solicitacoes com mais de 6 meses — LGPD |
| 2026-08-23 | **CORS restrito**: Edge Function so responde as origens conhecidas |
| 2026-08-23 | **Pentest com 12 vetores**: SQL injection (403 WAF), leitura anonima bloqueada (RLS), envio sem consentimento (400), honeypot, rajada (429), JSON malformado, origem desconhecida. 2 falhas reais corrigidas: XSS persistente e rate limit por IP forjado |
| 2026-08-23 | **Endurecimento da funcao** (F1-F4): IP pelo ultimo da cadeia XFF, limite de payload (413), regex de e-mail, limites server-side espelhando os do navegador |
| 2026-08-23 | **Limites de digitacao**: nome 80 (padrao PF), telefone 15 (ANATEL), cidade 40, motivo 300 com contador. Aplicados no navegador E no servidor |
| 2026-08-23 | **SEO basico**: `robots.txt`, titulo, meta description, Open Graph e favicon |
| 2026-08-23 | **Bateria tecnica 16/16**: carregamento, responsividade, maxlength, modal, consentimento, console e rede limpos |
| 2026-08-23 | **Auditoria final de seguranca**: RLS ativa nas 5 tabelas, anonimo le lista vazia em dados sensiveis, storage publico restrito as fotos, indices, FK, CHECKs |
| 2026-08-23 | **Historia real da ONG no site** (#31): secao "Sobre nos" com dados verdadeiros (fundacao 11/06/2018) e canais oficiais — fim dos links placeholder |
| 2026-08-23 | **Google Analytics 4** (#33): propriedade oficial criada, ID `G-S08M6034SR` — tag com gatilho LGPD |
| 2026-08-23 | **Politica de Privacidade completa** (#35): modal com linguagem simples, CNPJ, dados, finalidade, base legal, retencao, compartilhamento, cookies, seguranca, direitos (art. 18) |
| 2026-08-23 | **CI/GitHub endurecido** (#37): CodeQL + gitleaks, dependabot, handoff com contratos de API |
| 2026-08-28 | **Refatoracao da Edge Function**: `index.ts` dividido em `cors.ts`, `validar.ts` e `seguranca.ts` — separacao de responsabilidades |
| 2026-08-28 | **Front-end reescrito a mao** (#52/Rota B): HTML limpo (zero inline), CSS em `tema.css` + `estilo.css`, JS em `app.js`, CI com `estrutura-frontend` |
| 2026-08-28 | **Correcoes de producao** (PR #59): CORS com origem publicada, `login.js` com classes CSS, `Cache-Control: no-store`, header `Allow` no 405, CI varrendo JS do admin |
| 2026-08-29 | **Melhorias de acessibilidade e qualidade**: focus trap + Escape nos modais, skip-to-content, alt texts, theme-color, JSON-LD, `<small>` no rodape, passive scroll, schema.sql atualizado |

*(proximos registros entram aqui)*

---

## 12. Segurança e LGPD — por que cada decisão foi tomada

> Esta seção existe porque na apresentação não basta mostrar **o que** fizemos:
> precisamos defender **por quê**. Cada decisão abaixo nasceu de um risco real,
> muitos deles ilustrados por casos que apareceram nos noticiários em 2025-2026.

### 12.1 A lição do iFood (dez/2025): validar quem acessa o quê

Em dezembro/2025 o iFood sofreu acesso indevido aos dados cadastrais de
~1,2 milhão de usuários através de uma falha do tipo **IDOR** (acesso direto a
objetos sem verificar permissão) e demorou 6 meses para comunicar a ANPD.
**O que aprendemos e aplicamos:** nenhuma consulta ao banco confia no cliente.
Quem pode ler solicitações de adoção é definido por política no banco (RLS),
não pela tela. E registramos base de consentimento (`termo_versao`) para saber
exatamente o que cada titular autorizou e quando.

### 12.2 A lição do Moltbook (fev/2026): chave pública + RLS

Uma rede social expôs 1,5 milhão de tokens e milhares de e-mails porque usava
Supabase **sem políticas de Row Level Security**: a chave pública que fica no
navegador virou passe livre para o banco inteiro, inclusive escrita.
**Nossa arquitetura é exatamente esse cenário — com a diferença que salva:**
a chave publicável está no nosso HTML (por design do Supabase), mas TODAS as
5 tabelas têm RLS ativa. Provamos com testes: anônimo lê catálogo de animais
disponíveis (conteúdo público do site), mas recebe lista vazia em `adocoes`,
`perfis_membros`, `log_seguranca` e `rate_limit_envios`, e leva 401 ao tentar
escrever em qualquer tabela.

### 12.3 Defesa em camadas (se uma falhar, a próxima segura)

| Camada | Protege contra | Como provamos |
|---|---|---|
| WAF Cloudflare (do Supabase) | SQL injection, path traversal | Payload malicioso → 403 antes de chegar à função |
| Edge Function | Dados inválidos, excesso de tamanho, sem consentimento | 400 amigável / 413 / bloqueio sem checkbox |
| Rate limit (RPC atômica) | Rajadas de bot | 429 após 5/min por IP; teto global 60/min |
| Honeypot | Robôs preenchedores | Bot ganha resposta falsa 200; banco não grava |
| RLS | Leitura/escrita direta no banco | GET anon → `[]`; POST anon → 401 |
| Escape de HTML (XSS) | Código injetado via cadastro | `<script>` num nome renderiza como texto |
| CORS restrito | Uso do endpoint por outros sites | Origem desconhecida não recebe autorização |

### 12.4 LGPD na prática (não só no papel)

- **Consentimento explícito**: checkbox separado e obrigatório, com resumo
  legível; sem ele nem o servidor aceita (não é só escondido na tela).
- **Prova do consentimento**: gravamos a versão do termo aceita
  (`termo_versao = v1-2026-08`).
- **Minimização**: coletamos só o necessário para contato sobre a adoção;
  logs de segurança guardam apenas evento/IP/detalhe técnico.
- **Retenção**: job diário apaga solicitações com mais de 6 meses
  (art. 15/16 - dados mantidos apenas pelo período necessário).
- **Cookies/analytics**: banner com Aceitar/Recusar; GA so carrega com aceite;
  recusa tambem e memorizada.

### 12.5 Banco de dados — escolhas de modelagem

- **UUID como chave primária**: IDs não sequenciais não expõem volume de
  registros nem permitem "chutar" o próximo ID.
- **CHECK de domínio** em status/porte/sexo: o banco recusa valor inválido
  mesmo se alguém furar a aplicação.
- **FK com ON DELETE SET NULL**: excluir um animal não apaga o histórico de
  solicitações da ONG (interesse administrativo).
- **Índices** em `animal_id` e `(status, created_at)`: consultas do painel
  ficam rápidas conforme os dados crescem.

### 12.6 O que recomendamos antes de ir ao ar (roadmap curto)

1. Dominio proprio (registro.br, ~R$40/ano) e HTTPS gerenciado;
2. Ativar MFA na conta Supabase e rotacionar a senha do banco pos-apresentacao;
3. Branch protection + CI basico (ja ativo);
4. Google Search Console + sitemap.xml com a URL final;
5. Sentry para erros em producao (plano gratuito).

---

## 13. Referências Bibliográficas

- BRASIL. Ministério da Educação. **Resolução nº 7, de 18 de dezembro de 2018.** Estabelece as Diretrizes para a Extensão na Educação Superior Brasileira. Brasília, 2018.
- MOREIRA, Heloisa de Souza Pimentel. **Atividades Práticas Interdisciplinares de Extensão I.** Recife: Editora Ser Educacional, 2023.
- FREIRE, Paulo. **Extensão ou Comunicação?** Rio de Janeiro: Paz e Terra, 1983.
- DE PAULA, João Antônio. **Extensão universitária: história, conceito e propostas.** Interface — Comunicação, Saúde, Educação, 2013.
- **Supabase Documentation.** Disponível em: https://supabase.com/docs. Acesso em ago. 2026.
- **n8n Documentation.** Disponível em: https://docs.n8n.io. Acesso em ago. 2026.
- **Supabase — Edge Functions.** Disponível em: https://supabase.com/docs/guides/functions. Acesso em ago. 2026.
- ROCHA, Maria Auxiliadora da. *A terceira missão universitária*. 2001 (citado em Moreira, 2023).
