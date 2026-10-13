-- ============================================================
-- ADOTA PATOS | Migração 004 - Rate limit distribuído
-- Data: 2026-08-22
-- Objetivo: limitar envios por IP de forma confiável.
-- Por que no banco? A Edge Function roda em várias instâncias e
-- a memória delas não é compartilhada; uma tabela é a "caderneta"
-- única que todas enxergam.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_envios (
    ip            TEXT PRIMARY KEY,
    janela_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    contador      INT NOT NULL DEFAULT 0
);

-- Sem políticas RLS = anon/authenticated não veem nem mexem.
-- Só a chave do servidor (service role) acessa, via Edge Function.
ALTER TABLE public.rate_limit_envios ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limit_envios IS
    'Controle anti-spam: quantas vezes cada IP chamou a função receber-adocao na janela atual.';

-- Incrementa o contador do IP E o teto global (reinicia se a janela
-- de 1 min expirou). Devolve true se ambos estão dentro do limite.
-- Por que teto global? Porque o cabeçalho x-forwarded-for pode ser
-- forjado pelo atacante, diluindo o limite por IP; o teto global
-- conta TODAS as requisições, sem exceção, e protege o recurso.
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
    -- Caderneta individual do IP
    INSERT INTO rate_limit_envios (ip) VALUES (p_ip)
    ON CONFLICT (ip) DO NOTHING;

    UPDATE rate_limit_envios
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = p_ip
     RETURNING contador INTO v_contador;

    -- Caderneta global (uma só para todo o site)
    INSERT INTO rate_limit_envios (ip) VALUES ('__teto_global__')
    ON CONFLICT (ip) DO NOTHING;

    UPDATE rate_limit_envios
       SET contador = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN 1 ELSE contador + 1 END,
           janela_inicio = CASE WHEN janela_inicio < now() - INTERVAL '1 minute'
                           THEN now() ELSE janela_inicio END
     WHERE ip = '__teto_global__'
     RETURNING contador INTO v_contador_global;

    RETURN v_contador <= p_limite AND v_contador_global <= p_limite_global;
END $$;

-- Limpeza: entradas velhas saem junto com a rotina diária de retenção LGPD.
SELECT cron.unschedule('limpeza-rate-limit')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'limpeza-rate-limit');

SELECT cron.schedule(
    'limpeza-rate-limit',
    '5 0 * * *',
    $$DELETE FROM public.rate_limit_envios WHERE janela_inicio < now() - interval '10 minutes'$$
);
