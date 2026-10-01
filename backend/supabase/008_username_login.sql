-- ============================================================
-- ADOTA PATOS - Migration 008: login por username
-- ------------------------------------------------------------
-- Adiciona username (unico) na tabela perfis_membros,
-- sem alterar email (preserva autenticacao existente).
-- ============================================================

ALTER TABLE perfis_membros ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Preenche usernames para membros existentes (baseado no email local):
UPDATE perfis_membros
SET username = CASE
    WHEN email LIKE '%@%' THEN split_part(email, '@', 1)
    ELSE 'membro_' || id::text
END
WHERE username IS NULL;

-- Se todos os membros ja tiverem username, aplica NOT NULL:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM perfis_membros WHERE username IS NULL
    ) THEN
        ALTER TABLE perfis_membros ALTER COLUMN username SET NOT NULL;
    END IF;
END $$;

-- Atualiza eh_membro_ong para aceitar tanto email quanto username:
CREATE OR REPLACE FUNCTION eh_membro_ong() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM perfis_membros
        WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
           OR lower(username) = lower(COALESCE(auth.jwt() ->> 'username', ''))
    )
$$;
