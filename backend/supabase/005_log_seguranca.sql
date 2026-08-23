-- ============================================================
-- ADOTA PATOS | Migração 005 - Logs de segurança
-- Data: 2026-08-22
-- Objetivo: registrar eventos suspeitos (spam, robôs, sondagem)
-- para a equipe poder investigar "quem tentou o quê e quando".
-- ============================================================

CREATE TABLE IF NOT EXISTS public.log_seguranca (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento      TEXT NOT NULL,
    ip          TEXT,
    detalhe     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_seguranca_evento
    ON public.log_seguranca (evento, created_at DESC);

COMMENT ON TABLE public.log_seguranca IS
    'Diário de eventos suspeitos: rate limit estourado, honeypot acionado, erros repetidos.';

-- Anônimo não vê nem grava nada. Só o servidor (service role)
-- e os membros da ONG têm acesso.
ALTER TABLE public.log_seguranca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros leem logs de seguranca" ON public.log_seguranca;
CREATE POLICY "Membros leem logs de seguranca"
    ON public.log_seguranca
    FOR SELECT
    USING (public.eh_membro_ong());

-- Limpeza automática: logs valem 90 dias (LGPD: minimização).
SELECT cron.unschedule('limpeza-log-seguranca')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'limpeza-log-seguranca');

SELECT cron.schedule(
    'limpeza-log-seguranca',
    '10 0 * * *',
    $$DELETE FROM public.log_seguranca WHERE created_at < now() - interval '90 days'$$
);
