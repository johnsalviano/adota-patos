# Política de segurança

## Site protegido

O Adota Patos lida com dados pessoais de pessoas que querem adotar um animal.
Levamos a sério — e provamos cada camada em
[docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md), na seção de segurança.

## Como reportar uma vulnerabilidade

Use o **Private Vulnerability Reporting** do GitHub:
botão *Report a vulnerability* na aba **Security** deste repositório.

Ele é privado — só a equipe vê. Responda em até 7 dias e, confirmada a falha,
corrigimos e creditamos o autor do relato.

**Não abra Issue pública nem divulgue antes da correção.**

## Escopo

| Em escopo | Fora de escopo |
|---|---|
| Site público e painel administrativo | Ataques de negação de serviço (DoS/DDoS) |
| Edge Functions do Supabase | Spam volumétrico sem demonstração de impacto |
| Regras RLS do banco e storage | Engenharia social contra a equipe |
| Fluxos de autenticação | Testes automatizados em escala sem coordenação |

## Boas práticas para colaboradores

- Nunca commite chaves ou tokens (`.env` está no `.gitignore` por um motivo);
- Toda mudança passa por Pull Request com CI verde;
- Contas administrativas usam senhas fortes e, quando disponível, MFA.
