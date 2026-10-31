# ADOTA PATOS — Handoff para a ONG

> Documento para a equipe da ONG Adota Patos. Explica como usar e manter o sistema no dia a dia, sem depender de programador.

## 1. O que é o sistema

- **Site público:** https://johnsalviano.github.io/adota-patos/ — mostra os animais disponíveis e recebe solicitações de adoção.
- **Painel da equipe:** `https://johnsalviano.github.io/adota-patos/admin/login.html` — área protegida por login para cadastrar/editar animais, ver solicitações, confirmar doações e gerar relatórios de transparência.

## 2. Acesso ao painel

1. Acesse a URL do painel.
2. Digite seu **usuário** e **senha** (fornecidos pela equipe).
3. Marque **"Lembrar-me"** se estiver em um computador pessoal e de confiança — assim você não precisará fazer login de novo.
4. Clique em **"Entrar"**.

**Importante:** se marcar "Lembrar-me" em um computador compartilhado, outras pessoas poderão acessar o painel. Use apenas em máquinas de confiança.

## 3. Cadastrar um animal

1. No painel, vá na aba **"Cadastrar animal"**.
2. Preencha: nome, idade, sexo, porte, pelagem, descrição.
3. Envie uma foto (JPEG, PNG ou WebP, até 5 MB).
4. Clique em **"Cadastrar"**.
5. O animal aparece no catálogo público automaticamente.

## 4. Editar / excluir / marcar como adotado

1. Aba **"Animais cadastrados"**.
2. Use os botões de editar, excluir ou marcar como "Adotado".
3. "Adotado" remove o animal do catálogo público.

## 5. Solicitações de adoção

1. Aba **"Solicitações"**.
2. Veja as solicitações recebidas (nome, contato, animal, motivo).
3. Aprove ou recuse cada solicitação.
4. Ao aprovar, entre em contato com o candidato pelos dados fornecidos.

## 6. Doações e transparência

- Doações monetárias, de alimento e de outros bens são registradas pelo site.
- A equipe confirma doações monetárias manualmente (após conferir o extrato bancário) no painel.
- Relatórios de transparência podem ser enviados (PDF) e ficam públicos na página de transparência.

## 7. Cuidados importantes

- **Não compartilhe sua senha** com ninguém.
- **Não use "Lembrar-me"** em computadores compartilhados ou públicos.
- **Não crie animais fictícios** no sistema (os dados são reais e públicos).
- Se esquecer a senha, peça à equipe de desenvolvimento para redefinir.
- Em caso de erro ou dúvida, consulte a documentação em `docs/DOCUMENTACAO.md` ou contate o desenvolvedor.

## 8. Manutenção técnica (para desenvolvedores)

- Repositório: https://github.com/johnsalviano/adota-patos
- Branch principal: `main`
- Regras de trabalho: `REGRAS.md` e `AGENTS.md`
- Memória operacional: `docs/project/` (STATE, TASKS, HANDOFF, DECISIONS)
- Testes: `npx playwright test` (190 testes passando)
- Deploy: automático via GitHub Pages ao mergear em `main`

---
*Handoff para a ONG — Adota Patos, 2026-10-30.*