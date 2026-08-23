-- ============================================================
-- ADOTA PATOS | Migração 003 - Conformidade LGPD
-- Data: 2026-08-22
-- Objetivo: registrar consentimento expresso do candidato
--           (art. 7º, I, Lei 13.709/2018) em cada solicitação.
-- Idempotente: pode ser executada mais de uma vez sem erro.
-- ============================================================

ALTER TABLE public.adocoes
    ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS termo_versao TEXT;

COMMENT ON COLUMN public.adocoes.consentimento_lgpd IS
    'true quando o candidato marcou a autorização expressa de uso dos dados (art. 7º, I, LGPD).';
COMMENT ON COLUMN public.adocoes.termo_versao IS
    'Versão do texto de autorização aceita no momento do envio (ex.: v1-2026-08).';
