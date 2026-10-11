-- ============================================================
-- ADOTA PATOS — Migration 015: Transparência Financeira
-- ============================================================
-- Cria tabela para relatórios de transparência, bucket de storage
-- e políticas de acesso (público para leitura, restrito para escrita)

-- 1. TABELA DE RELATÓRIOS DE TRANSPARÊNCIA
CREATE TABLE IF NOT EXISTS transparencia_relatorios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano             INTEGER NOT NULL CHECK (ano >= 2018 AND ano <= 2100),
    mes             INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    arquivo_nome    TEXT NOT NULL,
    arquivo_path    TEXT NOT NULL, -- caminho no storage
    arquivo_tamanho BIGINT NOT NULL, -- tamanho em bytes
    enviado_por     UUID REFERENCES perfis_membros(id), -- quem enviou
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garante um relatório por mês/ano (pode ser substituído)
    UNIQUE (ano, mes)
);

COMMENT ON TABLE transparencia_relatorios IS 'Relatórios financeiros mensais de transparência publicados pela ONG.';

-- Índice para consulta por ano/mês (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_transparencia_ano_mes ON transparencia_relatorios(ano DESC, mes DESC);

-- 2. RLS (Row Level Security)
ALTER TABLE transparencia_relatorios ENABLE ROW LEVEL SECURITY;

-- 2.1 Leitura pública: qualquer um pode ver relatórios publicados
CREATE POLICY "publico_le_transparencia"
ON transparencia_relatorios FOR SELECT
TO anon, authenticated
USING (true);

-- 2.2 Escrita/Atualização/Exclusão: apenas o gerente autorizado (Rafael.Dantas)
-- A verificação é feita via função RPC que valida o username
CREATE POLICY "gerente_gerencia_transparencia"
ON transparencia_relatorios FOR ALL
TO authenticated
USING (public.eh_gerente_transparencia())
WITH CHECK (public.eh_gerente_transparencia());

-- 3. FUNÇÃO PARA VERIFICAR SE É O GERENTE DE TRANSPARÊNCIA
-- Retorna true apenas se o usuário autenticado for 'Rafael.Dantas'
CREATE OR REPLACE FUNCTION public.eh_gerente_transparencia()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM perfis_membros
        WHERE id = auth.uid()
          AND username = 'Rafael.Dantas'
    )
$$;

COMMENT ON FUNCTION public.eh_gerente_transparencia() IS
'Verifica se o usuário autenticado é o gerente de transparência (Rafael.Dantas). Usada em políticas RLS.';

-- 4. FUNÇÃO PARA OBTER USERNAME DO USUÁRIO ATUAL (para auditoria)
CREATE OR REPLACE FUNCTION public.meu_username_transparencia()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT username
    FROM perfis_membros
    WHERE id = auth.uid()
$$;

-- 5. STORAGE BUCKET PARA RELATÓRIOS DE TRANSPARÊNCIA
-- Público para leitura, restrito para escrita
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'transparencia-relatorios',
    'transparencia-relatorios',
    true,
    10485760, -- 10MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5.1 Política: leitura pública
CREATE POLICY "publico_le_transparencia_storage"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'transparencia-relatorios');

-- 5.2 Política: escrita/atualização/exclusão apenas pelo gerente
CREATE POLICY "gerente_gerencia_transparencia_storage"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'transparencia-relatorios'
    AND public.eh_gerente_transparencia()
)
WITH CHECK (
    bucket_id = 'transparencia-relatorios'
    AND public.eh_gerente_transparencia()
);

-- 6. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.atualizar_updated_at_transparencia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_transparencia ON transparencia_relatorios;
CREATE TRIGGER trigger_atualizar_updated_at_transparencia
    BEFORE UPDATE ON transparencia_relatorios
    FOR EACH ROW
    EXECUTE FUNCTION public.atualizar_updated_at_transparencia();

-- ============================================================
-- FIM DA MIGRATION 015
-- ============================================================