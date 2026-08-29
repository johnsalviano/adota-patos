# Guia de contribuição

Obrigado por querer ajudar o Adota Patos! Este projeto segue um fluxo simples
e rigoroso, pensado para duas pessoas trabalharem juntas sem pisar uma no trabalho da outra.

## O fluxo em 5 passos

1. **Abra uma Issue** descrevendo a tarefa — correção, melhoria ou função nova.
   Use uma das labels: `correcao` · `melhoria` · `nova-funcao`.
2. **Crie uma branch a partir da `main`**, nomeando assim:

   | Tipo | Prefixo | Exemplo |
   |---|---|---|
   | Função nova | `feat/` | `feat/painel-ong` |
   | Correção | `fix/` | `fix/contador-formulario` |
   | Documentação | `docs/` | `docs/politica-privacidade` |
   | Manutenção/infra | `chore/` | `chore/ci-pipeline` |

3. **Programe** seguindo o [REGRAS.md](REGRAS.md) — ele é o contrato do projeto
   (motion de interface, observabilidade, zero segredos).
4. **Abra o Pull Request** vinculando a Issue com `Closes #N`.
5. **Merge só após revisão e CI verde.** Nada vai direto para a `main`.

## Mensagens de commit

Padrão *conventional commits*, em português, direto ao ponto:

```
feat: contador de caracteres no campo motivo
fix: valida tamanho do telefone antes de gravar
docs: registra pentest na seção 11
chore: adiciona CI de estrutura do front-end
```

## Checklist antes de abrir o PR

- [ ] A Issue existe e está referenciada (`Closes #N`);
- [ ] Testou localmente os fluxos afetados;
- [ ] Documentação atualizada na seção 11 de `docs/DOCUMENTACAO.md`;
- [ ] Nenhuma chave, token ou senha no código.

## Reportando problemas de segurança

**Não abra Issue pública para falhas de segurança.** Veja
[SECURITY.md](SECURITY.md).
