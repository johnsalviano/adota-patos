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
    v_categoria_norm TEXT;
    v_limite_effective INT;
BEGIN
    -- Validar categoria
    v_categoria_norm := lower(trim(p_categoria));
    IF v_categoria_norm NOT IN ('login', 'adocao', 'doacao', 'afiliacao') THEN
        RAISE EXCEPTION 'Categoria inválida: %', p_categoria USING ERRCODE = '22023';
    END IF;

    -- Limite efetivo (não permite ampliar limite via parâmetro)
    v_limite_effective := CASE v_categoria_norm
        WHEN 'login' THEN 10
        WHEN 'adocao' THEN 5
        WHEN 'doacao' THEN 5
        WHEN 'afiliacao' THEN 5
        ELSE 5
    END;

    -- Caderneta individual do IP para esta categoria
    INSERT INTO rate_limit_envios_v2 (ip, categoria) VALUES (p_ip, v_categoria_norm)
    ON CONFLICT (ip, categoria) DO NOTHING;

    UPDATE rate_limit_envios_v2
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = p_ip AND categoria = v_categoria_norm
     RETURNING contador INTO v_contador;

    RETURN v_contador <= v_limite_effective;
END $$;

-- Permissões: revogar de papéis públicos, conceder apenas ao service_role
REVOKE EXECUTE ON FUNCTION public.registrar_envio_v2(text, text, int) FROM public;
REVOKE EXECUTE ON FUNCTION public.registrar_envio_v2(text, text, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_envio_v2(text, text, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_envio_v2(text, text, int) TO service_role;

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

-- Revogar execução da função legada
REVOKE EXECUTE ON FUNCTION public.registrar_envio(text, int, int) FROM public;
REVOKE EXECUTE ON FUNCTION public.registrar_envio(text, int, int) FROM anon;