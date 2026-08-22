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
| **Instituição** | [nome da faculdade / curso] |
| **Disciplina** | Atividades Práticas Interdisciplinares de Extensão I |
| **Período de execução** | Agosto/2026 – [data final] |

---

## 2. Introdução e Justificativa

Toda semana, em Patos-PB, animais são abandonados ou vivem nas ruas dependendo da boa vontade de protetores independentes. A ONG **Adota Patos** trabalha resgatando esses animais, cuidando deles e buscando pessoas dispostas a adotar.

O problema que a ONG enfrenta é quase todo manual: os animais disponíveis são divulgados em stories e grupos de WhatsApp, as solicitações de adoção chegam espalhadas por comentários e mensagens privadas, e ninguém consegue responder rápido quem demonstrou interesse. O resultado é conhecido: **animal demora a ser adotado, adotante desiste no meio do caminho e a ONG afoga em mensagens.**

Este projeto resolve isso com tecnologia simples e gratuita:

- Um **site público**, onde qualquer pessoa vê os animais disponíveis e se candidata a adotar em um formulário;
- Um **painel administrativo**, onde a ONG cadastra animais, publica fotos, marca adoções concretizadas e acompanha todas as solicitações num lugar só;
- Uma esteira automática nos bastidores: quando alguém preenche o formulário, os dados **chegam sozinhos** no banco de dados da ONG, sem ninguém precisar copiar e colar nada.

O impacto social está no elo mais fraco que a tecnologia fortalece: **quanto mais rápido um animal aparece para o adotante certo, mais curta é a espera dele por um lar.** E quanto menos tempo a ONG gasta com trabalho administrativo repetitivo, mais tempo ela dedica aos animais.

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
5. Usar apenas ferramentas com plano gratuito (Supabase, n8n Cloud), tornando o projeto **sustentável sem custo fixo**;
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
| **n8n Cloud** | Automação que liga o site ao banco | Recebe o formulário e grava no Supabase sem código no meio |
| **GitHub** | Guardar o código e histórico | Trabalho em dupla com versionamento |
| **Mermaid** | Diagramas desta documentação | Os diagramas são texto — fáceis de atualizar |

### 6.2 Como dividimos o trabalho

- **Matheus (front-end):** telas do site, telas do painel, experiência do usuário;
- **John (back-end):** modelagem do banco, segurança de acesso, webhook do n8n, integrações e esta documentação.

### 6.3 Método de trabalho

Trabalhamos em etapas curtas: primeiro o banco funcionando, depois o webhook, depois o site conectado. Cada etapa termina **testada e registrada** neste documento (seção 11). Toda tarefa vira uma Issue no GitHub e entra via Pull Request — assim fica rastro de quem fez o quê e por quê.

---

## 7. Arquitetura do Sistema — para que serve cada coisa

Aqui está o coração do projeto explicado sem mistério. São **três peças** trabalhando juntas:

```mermaid
flowchart LR
    V["👤 Visitante<br>(quer adotar)"] --> S["🌐 Site público<br>(catálogo + formulário)"]
    S -- "1. formulário preenchido" --> N["⚙️ n8n<br>(recepcionista automático)"]
    N -- "2. anota no caderno" --> DB[("🗄️ Supabase<br>(banco de dados + fotos)")]
    O["🏢 ONG<br>(equipe com login)"] --> P["🖥️ Painel admin"]
    P -- "cadastra/edita/marca adotado" --> DB
    DB -- "3. site sempre atualizado" --> S
```

### As três peças, uma por uma

**1. Supabase — o "caderno oficial" da ONG.**
É onde moram TODAS as informações: os animais cadastrados, as fotos, as solicitações de adoção. O site lê daqui; o painel escreve aqui. Quando a ONG marca o Thor como "Adotado" no painel, é esse registro que muda — e o site para de mostrar o Thor na hora, porque ele sempre consulta o mesmo caderno.

**2. Site público — a vitrine.**
Qualquer pessoa acessa, vê os animais disponíveis, clica em "Quero adotar" e preenche o formulário. Ele não salva nada diretamente no banco: entrega o formulário para o recepcionista abaixo.

**3. n8n — o recepcionista automático.**
Quando o formulário chega, o n8n recebe os dados e anota no "caderno" (Supabase), no capítulo certo (tabela `adocoes`). Por que não deixar o site gravar direto? **Segurança:** o site é público — se ele tivesse a chave para gravar no banco, qualquer pessoa mal-intencionada poderia usar essa chave. Com o n8n no meio, o banco só aceita escrita de solicitações vindas dele.

### O caminho de cada ação

| O que acontece | Caminho |
|---|---|
| ONG cadastra o Thor | Painel → Supabase → Thor já aparece no site |
| ONG marca Thor como Adotado | Painel → Supabase muda o status → some do catálogo |
| Visitante se candidata | Site → n8n → tabela `adocoes` → ONG vê no painel |
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
| 3. Banco de dados | Criação do projeto Supabase, tabelas e storage | 🔄 Em andamento |
| 4. Automação | Workflow no n8n (webhook → Supabase) | ⏳ Pendente |
| 5. Integração do site | Formulário enviando ao webhook; catálogo lendo o banco | ⏳ Pendente |
| 6. Painel da ONG | Login, CRUD de animais, lista de solicitações | ⏳ Pendente |
| 7. Testes completos | Fluxo inteiro ponta a ponta | ⏳ Pendente |
| 8. Implantação e treinamento | Colocar no ar e treinar a equipe da ONG | ⏳ Pendente |
| 9. Relatório final | Fechamento da documentação para entrega | ⏳ Pendente |

---

## 11. Registro de Desenvolvimento 📝

> **Regra do projeto: cada coisa que entrarmos ou melhorarmos ganha uma linha aqui.** É o nosso diário de bordo — serve para o relatório final da extensão e para lembrar decisões.

| Data | O que foi feito | Responsável |
|---|---|---|
| 2026-08-22 | Pesquisa de referências (repositórios similares) e definição das ferramentas (Supabase, n8n Cloud) | John e Matheus |
| 2026-08-22 | Matheus finalizou o protótipo HTML do site público (layout completo: catálogo, modal, formulário, responsivo) | Matheus |
| 2026-08-22 | Divisão formal: John = back-end/banco/integrações; Matheus = front-end/painel | John e Matheus |
| 2026-08-22 | Criada esta documentação viva + modelo conceitual dos dados | John |
| 2026-08-22 | Projeto criado no Supabase (conta conectada) | John |
| 2026-08-22 | Script SQL do banco criado (`backend/supabase/schema.sql`) — pendente de execução | John |

*(próximos registros entram aqui)*

---

## 12. Referências Bibliográficas

- BRASIL. Ministério da Educação. **Resolução nº 7, de 18 de dezembro de 2018.** Estabelece as Diretrizes para a Extensão na Educação Superior Brasileira. Brasília, 2018.
- MOREIRA, Heloisa de Souza Pimentel. **Atividades Práticas Interdisciplinares de Extensão I.** Recife: Editora Ser Educacional, 2023.
- FREIRE, Paulo. **Extensão ou Comunicação?** Rio de Janeiro: Paz e Terra, 1983.
- DE PAULA, João Antônio. **Extensão universitária: história, conceito e propostas.** Interface — Comunicação, Saúde, Educação, 2013.
- **Supabase Documentation.** Disponível em: https://supabase.com/docs. Acesso em ago. 2026.
- **n8n Documentation.** Disponível em: https://docs.n8n.io. Acesso em ago. 2026.
- ROCHA, Maria Auxiliadora da. *A terceira missão universitária*. 2001 (citado em Moreira, 2023).
