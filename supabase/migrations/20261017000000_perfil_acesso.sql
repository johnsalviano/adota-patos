-- ============================================================
-- ADOTA PATOS — Migration 018: Perfil de acesso e correção de
--   funções de autorização
-- ------------------------------------------------------------
-- 1. Adiciona coluna 'perfil' em perfis_membros para controle de
--    acesso baseado em roles (gerente, colaborador, desenvolvedor)
-- 2. Corrige eh_gerente_transparencia() para usar email-based matching
--    (consistente com eh_membro_ong) em vez de auth.uid(), que nao bate
--    com perfis_membros.id (auto-gerado, nao sincronizado com auth.users)
-- 3. Corrige meu_username() para usar email-based matching
-- ============================================================

-- 1. Coluna de perfil (role-based access control)
ALTER TABLE perfis_membros
    ADD COLUMN IF NOT EXISTS perfil TEXT NOT NULL DEFAULT 'colaborador'
    CHECK (perfil IN ('gerente', 'colaborador', 'desenvolvedor'));

COMMENT ON COLUMN perfis_membros.perfil IS
'Senha de acesso: gerente (acesso total ao módulo de transparência),
 colaborador (acesso ao painel, mas não ao módulo de transparência),
 desenvolvedor (mesmo acesso de gerente, para testes locais).';

-- 2. Corrige eh_gerente_transparencia(): usa email (consistente com
--    eh_membro_ong) em vez de auth.uid(), e verifica a coluna perfil.
--    Mantem o username = 'Rafael.Dantas' como fallback para compat.
CREATE OR REPLACE FUNCTION public.eh_gerente_transparencia()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM perfis_membros
        WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
          AND (
            perfil IN ('gerente', 'desenvolvedor')
            OR username = 'Rafael.Dantas'
          )
    )
$$;

COMMENT ON FUNCTION public.eh_gerente_transparencia() IS
'Verifica se o usuario autenticado e gerente ou desenvolvedor de transparência.
 Usa email-based matching (consistente com eh_membro_ong).
 Usada em políticas RLS e na Edge Function de upload.';

-- 3. Corrige meu_username(): usa email em vez de auth.uid()
CREATE OR REPLACE FUNCTION meu_username()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT username
    FROM perfis_membros
    WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    LIMIT 1
$$;

COMMENT ON FUNCTION meu_username() IS
'Username do membro autenticado, resolvido por email (nao por auth.uid()).
 SECURITY DEFINER porque perfis_membros fica trancado por RLS.';
