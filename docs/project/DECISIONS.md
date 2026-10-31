# DECISIONS.md — Histórico de Decisões do Projeto Adota Patos

> Decisões técnicas e de produto que devem ser preservadas. Cada entrada: data, decisão, motivo, impacto.

## D-001 — Substituição do n8n por Edge Function do Supabase (2026-08-22)
- Decisão: usar Edge Function do Supabase como receptor do formulário, em vez de n8n Cloud.
- Motivo: n8n cobra ~R$150/mês após o trial; a ONG exige custo zero.
- Impacto: receptor serverless gratuito, 24/7, incluído no plano Supabase.

## D-002 — Apenas ferramentas com plano gratuito (2026-08-22)
- Decisão: stack inteira com custo zero (Supabase, GitHub Pages, Sentry free, Biome, Playwright, gitleaks).
- Motivo: sustentabilidade da ONG sem custo fixo.
- Impacto: Stryker/Arch-contract considerados overkill (adiados).

## D-003 — Migração 002: perfis_membros (lista de e-mails autorizados) (2026-08-22)
- Decisão: apenas e-mails autorizados pela ONG têm poderes administrativos.
- Motivo: defesa contra criação de contas falsas.
- Impacto: `eh_membro_ong()` usado como guarda.

## D-004 — Pacote LGPD (migração 003) (2026-08-23)
- Decisão: consentimento obrigatório + versão do termo; retenção limitada (6 meses).
- Motivo: conformidade LGPD.
- Impacto: Edge Function recusa sem consentimento (400).

## D-005 — Rate limit por IP + teto global (migração 004) (2026-08-23)
- Decisão: 5 envios/min por IP, teto global 60/min; honeypot com resposta falsa.
- Motivo: IP pode ser forjado (XFF); teto global garante proteção.
- Impacto: proteção contra abuso mesmo com IP forjado.

## D-006 — Log de segurança com limpeza 90 dias (migração 005) (2026-08-23)
- Decisão: tabela `log_seguranca` com evento/IP/detalhe; limpeza automática.
- Motivo: rastreabilidade de segurança sem acúmulo.

## D-007 — CORS restrito às origens conhecidas (2026-08-23)
- Decisão: Edge Function responde apenas às origens oficiais.
- Motivo: evitar abuso cross-origin.

## D-008 — XSS: escape de HTML + URLs somente https:// (2026-08-23)
- Decisão: função de escape + validação de URL.
- Motivo: vulnerabilidade XSS encontrada e corrigida.

## D-009 — Proteção do storage (migração 007): MIME + 5MB (2026-09-28)
- Decisão: bucket `fotos-animais` aceita apenas JPEG/PNG/WebP, máx 5MB.
- Motivo: impedir burla da validação do navegador via API direta.

## D-010 — Login por username (migrações 008-010) (2026-09-30)
- Decisão: login por username em vez de e-mail direto.
- Motivo: usabilidade do painel.

## D-011 — Rate limit por categoria (migração 017) (2026-10-12)
- Decisão: categorizar rate limit.
- Motivo: granularidade de proteção.

## D-012 — Layout visual protegido (2026-10-18)
- Decisão: após layout aprovado, dimensões/proporções/object-fit/espaçamento/responsivo não podem ser alterados sem pedido explícito.
- Motivo: evitar regressões visuais acidentais.
- Impacto: prioridade máxima; nenhum agente altera sem autorização.

## D-013 — Regra de prevenção do catálogo (#catalogo-animais) (2026-10-19)
- Decisão: `.animals-grid` deve ser filho direto do container; `.section-header` fechado antes do grid; 3/2/1 colunas; imagens height 250px object-fit cover.
- Motivo: evitar aninhamento indevido que comprimia cards.
- Evidências: `REGRAS.md` seção "Regra de prevenção".

## D-014 — Frase-gatilho "Abra o navegador com depuração ao vivo" (2026-10-18)
- Decisão: significa abrir/reutilizar janela real do Chrome com CDP, conectar à aba do usuário, manter aberta.
- Motivo: validação visual real.

## D-015 — Não publicar sem confirmação do responsável (permanente)
- Decisão: commit/push/deploy/merge exigem autorização.
- Motivo: controle de publicação.

## D-016 — Não criar animais fictícios em produção (permanente)
- Decisão: proibido.
- Motivo: integridade dos dados reais da ONG.

## D-017 - Adoção do PUCP (2026-10-30)
- Decisão: projeto armazena sua memória operacional em `AGENTS.md` + `docs/project/`.
- Motivo: continuidade entre agentes/sessões/computadores.
- Impacto: estrutura `docs/project/` adicionada; handoffs anteriores preservados.

## D-018 - Remoção da funcionalidade "ver senha" (2026-10-30)
- Decisão: remover o botão toggle de mostrar/ocultar senha do campo de senha do login.
- Motivo: com o "Lembrar-me" auto-preenchendo e auto-submetendo, o "ver senha" se torna desnecessário e pode expor a senha em máquina compartilhada (risco de colaborador mal-intencionado).
- Impacto: código removido de `login.html`, `login.css` e `login.js`. T-046 marcado como ADIADO.

---
*Novas decisões: adicionar aqui com D-XXX, data, motivo e impacto.*