# AGENTS.md — Regras Operacionais do Projeto Adota Patos

> Este arquivo é a fonte principal das regras operacionais do projeto. **Todo agente que trabalhar neste repositório DEVE ler este arquivo e os documentos operacionais indicados abaixo antes de agir.**

## 1. Protocolo Universal de Continuidade (PUCP) — OBRIGATÓRIO

Este projeto adota o Protocolo Universal de Continuidade, Rastreabilidade e Handoff entre Agentes. A memória operacional do projeto vive **dentro do próprio repositório**, não na conversa nem na sessão.

### 1.1 Ao iniciar uma sessão, o agente DEVE:

1. Ler este `AGENTS.md`.
2. Ler `docs/project/STATE.md` (estado atual resumido).
3. Ler `docs/project/TASKS.md` (checklist central).
4. Ler `docs/project/HANDOFF.md` (último handoff).
5. Consultar `docs/project/DECISIONS.md` quando a tarefa tocar decisões anteriores.
6. Consultar `docs/DOCUMENTACAO.md` (documento vivo principal) para contexto detalhado.
7. Verificar `git status`, branch atual e último commit antes de qualquer alteração.

### 1.2 Durante o trabalho, o agente DEVE:

- Respeitar o checklist em `docs/project/TASKS.md`.
- Registrar decisões importantes em `docs/project/DECISIONS.md`.
- Atualizar `docs/project/STATE.md` ao mudar o estado do projeto.
- Atualizar `docs/project/TASKS.md` imediatamente após validar uma tarefa (marcar como CONCLUÍDO).
- Quando uma implementação apresentar falhas, registrar o problema e manter a tarefa aberta.
- Preservar integralmente o trabalho anterior e alterações não commitadas.
- Não apagar tarefas concluídas do checklist.
- Não alterar identificadores de tarefas sem necessidade.
- Adicionar novas necessidades ao checklist (não deixar fora).

### 1.3 Ao encerrar uma sessão / antes de parar, o agente DEVE:

- Atualizar `docs/project/STATE.md` com o estado real.
- Atualizar `docs/project/TASKS.md` com os estados corretos.
- Preparar/atualizar `docs/project/HANDOFF.md` para que outro agente continue exatamente de onde parou.
- Registrar no `docs/DOCUMENTACAO.md` (seção 11) qualquer coisa inserida/alterada/melhorada.

### 1.4 Proibições absolutas:

- **É proibido afirmar que algo foi concluído sem evidência adequada.** Sem evidência, classificar como PENDENTE DE VALIDAÇÃO ou BLOQUEADO.
- **É proibido mascarar erros, criar bypasses ou simular sucesso** (ver política de integridade técnica em `REGRAS.md` e AGENTS.md global).
- **É proibido destruir trabalho não commitado** (`git clean`, `git reset --hard`, etc.) sem autorização.
- **É proibido alterar banco de produção** sem autorização explícita.
- **É proibido publicar (commit/push/deploy)** sem autorização do responsável.

## 2. Caminhos dos documentos operacionais

| Documento | Caminho | Responsabilidade |
|---|---|---|
| Regras permanentes | `AGENTS.md` (este arquivo) | Regras operacionais do projeto |
| Identidade do projeto | `docs/project/PROJECT.md` | Nome, finalidade, escopo, stack, restrições |
| Checklist central | `docs/project/TASKS.md` | Todas as tarefas (concluídas e pendentes) |
| Planejamento | `docs/project/ROADMAP.md` | Etapas, fases, marcos |
| Estado atual | `docs/project/STATE.md` | Resumo rápido da situação atual |
| Histórico de decisões | `docs/project/DECISIONS.md` | Decisões técnicas preservadas |
| Handoff | `docs/project/HANDOFF.md` | Como continuar de onde parou |
| Histórico | `docs/project/history/` | Handoffs e estados anteriores arquivados |
| Documento vivo principal | `docs/DOCUMENTACAO.md` | Documentação completa do projeto |
| Modelo conceitual | `docs/MODELO_CONCEITUAL.md` | Modelagem de dados |
| Regras do projeto | `REGRAS.md` | Padrões obrigatórios (fluxo, UI, qualidade) |

## 3. Regras permanentes do projeto (resumo — detalhes em REGRAS.md)

1. Toda tarefa nasce como Issue no GitHub antes de código ser escrito.
2. Todo código entra via Pull Request. Nunca commit direto em `main`.
3. PR menciona a Issue com `Closes #N` ou `Refs #N`.
4. Português brasileiro em tudo (código pode manter termos técnicos em inglês).
5. Documentação atualizada junto com o código.
6. Zero segredos no repositório (exceção: chave publicável, com restrições).
7. Zero rastros (nada que ajude a perseguir credenciais).
8. Layout visual protegido: não alterar dimensões/proporções/object-fit sem pedido explícito.
9. Nunca mascarar erros ou simular sucesso.

## 4. Ambientes de agentes

Compatível com: OpenCode, Hermes Agent, DeepSeek Harness, AionUI, Claude Code, Codex, Cursor e outros agentes que leem `AGENTS.md`. Cada agente deve adaptar sua forma de operar, mas sempre respeitando os documentos operacionais acima.

## 5. Histórico de handoffs anteriores (preservados)

- `docs/HANDOFF-HERMES.md` (2026-10-19)
- `docs/HANDOFF-OPENCODE.md` (2026-10-19)

Estes foram consolidados em `docs/project/HANDOFF.md`. Mantidos para referência.

---
*Implementado em 2026-10-30 via PUCP.*