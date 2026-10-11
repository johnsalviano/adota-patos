-- ============================================================
-- ADOTA PATOS | Migração 017 - Rate limit por categoria
-- Data: 2026-10-11
-- Objetivo: substituir o teto global único por tetos por categoria,
-- isolando login, adoção, doação e afiliação. Mantém limite individual
-- por IP e adiciona teto por categoria para evitar que abuso de um
-- serviço bloqueie os demais.
-- ============================================================

-- Nova tabela com suporte a categoria
CREATE TABLE IF NOT EXISTS public.rate_limit_envios_v2 (
    id            BIGSERIAL PRIMARY KEY,
    ip            TEXT NOT NULL,
    categoria     TEXT NOT NULL,
    janela_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    contador      INT NOT NULL DEFAULT 0,
    UNIQUE (ip, categoria)
);

-- Índice para limpeza eficiente
CREATE INDEX IF NOT EXISTS idx_rate_limit_v2_cleanup
    ON public.rate_limit_envios_v2 (janela_inicio);

-- Habilita RLS (apenas service role acessa)
ALTER TABLE public.rate_limit_envios_v2 ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limit_envios_v2 IS
    'Controle anti-spam por IP e categoria (login, adocao, doacao, afiliacao).';

-- Função para registrar envio com teto por categoria
CREATE OR REPLACE FUNCTION public.registrar_envio_v2(
    p_ip        TEXT,
    p_categoria TEXT,
    p_limite    INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contador INT;
BEGIN
    -- Caderneta individual do IP para esta categoria
    INSERT INTO rate_limit_envios_v2 (ip, categoria) VALUES (p_ip, p_categoria)
    ON CONFLICT (ip, categoria) DO NOTHING;

    UPDATE rate_limit_envios_v2
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = p_ip AND categoria = p_categoria
     RETURNING contador INTO v_contador;

    RETURN v_contador <= p_limite;
END $$;

-- Limpeza automática via pg_cron (remove entradas > 10 min)
SELECT cron.unschedule('limpeza-rate-limit-v2')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'limpeza-rate-limit-v2');

SELECT cron.schedule(
    'limpeza-rate-limit-v2',
    '5 0 * * *',
    $$DELETE FROM public.rate_limit_envios_v2 WHERE janela_inicio < now() - interval '10 minutes'$$
);

-- Mantém a função antiga para compatibilidade durante transição
-- (pode ser removida após deploy completo)
CREATE OR REPLACE FUNCTION public.registrar_envio(
    p_ip            TEXT,
    p_limite        INT,
    p_limite_global INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contador        INT;
    v_contador_global INT;
BEGIN
    -- Caderneta individual do IP (usa categoria 'legacy')
    INSERT INTO rate_limit_envios_v2 (ip, categoria) VALUES (p_ip, 'legacy')
    ON CONFLICT (ip, categoria) DO NOTHING;

    UPDATE rate_limit_envios_v2
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = p_ip AND categoria = 'legacy'
     RETURNING contador INTO v_contador;

    -- Teto global (uma só para todo o site)
    INSERT INTO rate_limit_envios_v2 (ip, categoria) VALUES ('__teto_global__', 'global')
    ON CONFLICT (ip, categoria) DO NOTHING;

    UPDATE rate_limit_envios_v2
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = '__teto_global__' AND categoria = 'global'
     RETURNING contador INTO v_contador_global;

    RETURN v_contador <= p_limite AND v_contador_global <= p_limite_global;
END $$;