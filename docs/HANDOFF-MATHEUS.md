# Handoff — Front-end (Matheus)

> Atualizado em 23/08/2026. Tudo que você precisa para conectar suas telas ao
> back-end real, sem depender de ninguém. Dúvidas? Comentário na issue #5.

## 1. O que já existe e funciona (não mexer sem avisar o John)

| Peça | Onde | Estado |
|---|---|---|
| Catálogo dinâmico do site | `frontend/js/app.js` + `frontend/index.html` | ✅ no ar localmente, testado |
| Formulário público → banco | Edge Function `receber-adocao` (Supabase) | ✅ testada ponta a ponta |
| Login da equipe | `frontend/admin/login.html` | ✅ seu código, validado pelo back |
| Painel (esqueleto) | `frontend/admin/painel.html` | 🚧 guarda dupla + logout prontos; CRUD é a issue #5 |

**Regra de ouro do projeto:** o site público é escrito à mão em
`frontend/index.html` (estrutura), `frontend/css/` (apresentação) e
`frontend/js/app.js` (comportamento) — nada de estilo, script ou evento inline.
Os três arquivos se comunicam por ids e classes estáveis. Suas telas em
`frontend/admin/` seguem a mesma regra. A arte original do Matheus ficou
arquivada em `docs/arte-original/adota-patos.html` como referência visual,
fora do desenvolvimento ativo.

## 2. Chaves públicas (podem ficar no front, por design)

Use as MESMAS constantes já presentes em `frontend/js/app.js` (bloco
`SUPABASE_URL` / `SUPABASE_KEY`) e em
`frontend/admin/login.html`. Não copie a chave para outros arquivos ou
documentos — um único lugar por arquivo, e o gitleaks do CI confere tudo.

A segurança real não depende de esconder isso: cada tabela tem RLS
(Row Level Security). O anônimo só lê catálogo; quem manda é a lista de
membros autorizados (`perfis_membros`) via função `eh_membro_ong()`.

## 3. Contratos de API

### 3.1 Ler catálogo (site público, anônimo)
```js
fetch(SUPABASE_URL + "/rest/v1/animais?status=eq.Dispon%C3%ADvel" +
      "&select=id,nome,idade,sexo,porte,descricao,foto_url&order=created_at.desc",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
```
Colunas de `animais`: id (uuid), nome, especie, raca, idade, sexo, porte,
descricao, foto_url, status, created_at. Status válidos: `Disponível`,
`Adotado`, `Reservado` (CHECK no banco — valor errado nem grava).

### 3.2 Enviar solicitação (site público, anônimo)
```js
POST https://fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/receber-adocao
Content-Type: application/json
// CORS liberado só para as origens conhecidas (localhost hoje, domínio depois)

{ animal_id?, nome, telefone, email, cidade, experiencia, motivo,
  consentimento: true }
```
Respostas: 200 gravou · 400 dados inválidos (lista amigável no corpo) ·
413 payload > 10 KB · 429 muitos envios · honeypot responde 200 falso.

### 3.3 Área da equipe (suas telas admin)
Use o `supabase-js` com a MESMA chave pública + sessão do login:

- **Quem pode tudo:** usuário autenticado E `eh_membro_ong() === true`
  (RPC: `await cliente.rpc('eh_membro_ong')`)
- **Ler solicitações:** `.from('adocoes').select('*')` — RLS só devolve linhas
  para membros (anônimo recebe lista vazia)
- **Atualizar status:** `.from('adocoes').update({status})` — valores:
  `Pendente`, `Em análise`, `Aprovada`, `Recusada`
- **Cadastrar/editar animais:** `.from('animais')` — insert/update livres
  para membros
- **Fotos:** bucket `fotos-animais` (público para leitura; escrita só membro):
  ```js
  await cliente.storage.from('fotos-animais')
        .upload(`animais/${crypto.randomUUID()}.jpg`, arquivo)
  // depois: cliente.storage.from('fotos-animais').getPublicUrl(caminho)
  // grave o resultado em animais.foto_url
  ```

### 3.4 RPCs existentes (não criar de novo)
| RPC | Para quê |
|---|---|
| `eh_membro_ong()` | booleano: usuário logado está autorizado? |
| `registrar_envio(...)` | rate limit atômico (usado pela Edge Function; não chamar do front) |

## 4. Padrões obrigatórios das telas (contrato do repo — REGRAS.md)

1. **Escape TODO dado dinâmico** antes de renderizar (padrão do painel.html:
   `escaparTexto`). Histórico: tivemos XSS real corrigido — não reabrir.
2. **maxlength nos inputs**: nome 80, telefone 15, email 100, cidade 40,
   motivo 300 (espelhados no servidor).
3. Linguagem humanizada pt-BR nas mensagens de UI.
4. Comentários de código SEM acento.
5. **Separation of Concerns**: HTML = estrutura, CSS = apresentação, JS =
   comportamento. Sem `style=`, `onclick=`/`oninput=` inline nem `<style>`/
   `<script>` embutidos — o CI (`estrutura-frontend`) reprova se aparecer.
6. Toda mudança: Issue → branch → PR (main protegida, CI obrigatório).

## 5. Divisão sugerida da issue #5

| Parte | Quem |
|---|---|
| Telas: listagem de solicitações, aprovar/recusar, formulário de cadastro de animal com upload | **Matheus** |
| Migrações SQL novas (colunas/campos que faltarem), ajustes na Edge Function, testes de segurança das policies | **John** |

Antes de começar: confira se precisa de campo novo no banco e abra comentário
na #5 — migração primeiro, tela depois.

## 6. Testar localmente

1. Sirva `frontend/` com um servidor estático (ex.: `python -m http.server 8788`
   dentro de `frontend/`) e abra `http://localhost:8788` — não abra via `file://`
   porque as chamadas ao Supabase exigem origem servida por HTTP; o banner de
   cookies aparece na primeira visita.
2. Para o painel: crie uma conta de teste em login.html e peça ao John para
   incluir o e-mail em `perfis_membros` (passo a passo no MODELO_CONCEITUAL §5).
