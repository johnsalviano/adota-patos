# Handoff — Front-end (Matheus)

> Atualizado em 28/08/2026. Tudo que voce precisa para conectar suas telas ao
> back-end real. Duvidas? Comentario na issue #5.

## 1. O que ja existe e funciona

| Peca | Onde | Estado |
|---|---|---|
| Catalogo dinamico do site | `frontend/js/app.js` + `frontend/index.html` | no ar localmente, testado |
| Formulario publico -> banco | Edge Function `receber-adocao` (Supabase) | testada ponta a ponta |
| Login da equipe | `frontend/admin/login.html` | validado |
| Painel (esqueleto) | `frontend/admin/painel.html` | guarda dupla + logout prontos; CRUD e a issue #5 |

**Regra do projeto:** o site publico e escrito a mao em
`frontend/index.html` (estrutura), `frontend/css/` (apresentacao) e
`frontend/js/app.js` (comportamento) — nada de estilo, script ou evento inline.
Os tres arquivos se comunicam por ids e classes estaveis. Suas telas em
`frontend/admin/` seguem a mesma regra. A arte original do Matheus ficou
arquivada em `docs/arte-original/adota-patos.html` como referencia visual,
fora do desenvolvimento ativo.

## 2. Chaves publicas (podem ficar no front, por design)

Use as MESMAS constantes ja presentes em `frontend/js/app.js` (bloco
`SUPABASE_URL` / `SUPABASE_KEY`) e em
`frontend/admin/login.html`. Nao copie a chave para outros arquivos ou
documentos — um unico lugar por arquivo, e o gitleaks do CI confere tudo.

A seguranca real nao depende de esconder isso: cada tabela tem RLS
(Row Level Security). O anon so le catalogo; quem manda e a lista de
membros autorizados (`perfis_membros`) via funcao `eh_membro_ong()`.

## 3. Contratos de API

### 3.1 Ler catalogo (site publico, anonimo)
```js
fetch(SUPABASE_URL + "/rest/v1/animais?status=eq.Dispon%C3%ADvel" +
      "&select=id,nome,idade,sexo,porte,descricao,foto_url&order=created_at.desc",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
```
Colunas de `animais`: id (uuid), nome, especie, raca, idade, sexo, porte,
descricao, foto_url, status, created_at. Status validos: `Disponivel`,
`Adotado`, `Reservado` (CHECK no banco — valor errado nem grava).

### 3.2 Enviar solicitacao (site publico, anonimo)
```js
POST https://fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/receber-adocao
Content-Type: application/json

{ animal_id?, nome, telefone, email, cidade, experiencia, motivo,
  consentimento: true }
```
Respostas: 200 gravou · 400 dados invalidos (lista amigavel no corpo) ·
413 payload > 10 KB · 429 muitos envios · honeypot responde 200 falso.

### 3.3 Area da equipe (suas telas admin)
Use o `supabase-js` com a MESMA chave publica + sessao do login:

- **Quem pode tudo:** usuario autenticado E `eh_membro_ong() === true`
  (RPC: `await cliente.rpc('eh_membro_ong')`)
- **Ler solicitacoes:** `.from('adocoes').select('*')` — RLS so devolve linhas
  para membros (anonimo recebe lista vazia)
- **Atualizar status:** `.from('adocoes').update({status})` — valores:
  `Pendente`, `Em analise`, `Aprovada`, `Recusada`
- **Cadastrar/editar animais:** `.from('animais')` — insert/update livres
  para membros
- **Fotos:** bucket `fotos-animais` (publico para leitura; escrita so membro):
  ```js
  await cliente.storage.from('fotos-animais')
        .upload(`animais/${crypto.randomUUID()}.jpg`, arquivo)
  // depois: cliente.storage.from('fotos-animais').getPublicUrl(caminho)
  // grave o resultado em animais.foto_url
  ```

### 3.4 RPCs existentes (nao criar de novo)
| RPC | Para que |
|---|---|
| `eh_membro_ong()` | booleano: usuario logado esta autorizado? |
| `registrar_envio(...)` | rate limit atomico (usado pela Edge Function; nao chamar do front) |

## 4. Padroes obrigatorios das telas (contrato do repo — REGRAS.md)

1. **Escape TODO dado dinamico** antes de renderizar (padrao do painel.html:
   `escaparTexto`). Historico: tivemos XSS real corrigido — nao reabrir.
2. **maxlength nos inputs**: nome 80, telefone 15, email 100, cidade 40,
   motivo 300 (espelhados no servidor).
3. Linguagem humanizada pt-BR nas mensagens de UI.
4. Comentarios de codigo SEM acento.
5. **Separation of Concerns**: HTML = estrutura, CSS = apresentacao, JS =
   comportamento. Sem `style=`, `onclick=`/`oninput=` inline nem `<style>`/
   `<script>` embutidos — o CI (`estrutura-frontend`) reprova se aparecer.
6. Toda mudanca: Issue -> branch -> PR (main protegida, CI obrigatorio).

## 5. Divisao sugerida da issue #5

| Parte | Quem |
|---|---|
| Telas: listagem de solicitacoes, aprovar/recusar, formulario de cadastro de animal com upload | **Matheus** |
| Migracoes SQL novas (colunas/campos que faltarem), ajustes na Edge Function, testes de seguranca das policies | **John** |

Antes de comecar: confira se precisa de campo novo no banco e abra comentario
na #5 — migracao primeiro, tela depois.

## 6. Testar localmente

1. Sirva `frontend/` com um servidor estatico (ex.: `python -m http.server 8788`
   dentro de `frontend/`) e abra `http://localhost:8788` — nao abra via `file://`
   porque as chamadas ao Supabase exigem origem servida por HTTP; o banner de
   cookies aparece na primeira visita.
2. Para o painel: crie uma conta de teste em login.html e inclua o e-mail em
   `perfis_membros` pelo SQL Editor do Supabase (passo a passo no
   MODELO_CONCEITUAL §5).
