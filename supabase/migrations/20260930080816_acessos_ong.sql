-- ============================================================
-- 🐾 ADOTA PATOS — Migração 002: acessos da equipe da ONG
-- ------------------------------------------------------------
-- Objetivo: garantir que SOMENTE pessoas autorizadas (lista
-- controlada por e-mail) tenham poderes de administração.
--
-- Com isso, mesmo se alguém criar uma conta falsa no sistema,
-- ela não consegue cadastrar, editar ou apagar nada: o banco só
-- obedece quem está na lista "perfis_membros".
-- ============================================================


-- ============================================================
-- 1. LISTA DE MEMBROS AUTORIZADOS
-- Para dar acesso a alguém da ONG: inserir o e-mail dela aqui
-- (pelo Table Editor do Supabase, ou pelo painel no futuro).
-- ============================================================

CREATE TABLE IF NOT EXISTS perfis_membros (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email     TEXT NOT NULL UNIQUE,
    nome      TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE perfis_membros ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE perfis_membros IS
'Lista autorizada de pessoas da ONG. Só quem está aqui (por e-mail) tem poderes no sistema.';


-- ============================================================
-- 2. FUNÇÃO AUXILIAR DE VERIFICAÇÃO
-- Pergunta ao login atual: "este e-mail está na lista?".
-- SECURITY DEFINER permite a leitura da lista sem abri-la ao público.
-- ============================================================

CREATE OR REPLACE FUNCTION eh_membro_ong() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM perfis_membros
        WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
$$;


-- ============================================================
-- 3. POLÍTICAS ATUALIZADAS
-- As mesmas permissões de antes, agora exigindo ser membro.
-- ============================================================

DROP POLICY IF EXISTS "ong_gerencia_animais" ON animais;
CREATE POLICY "ong_gerencia_animais"
ON animais FOR ALL TO authenticated
USING (eh_membro_ong())
WITH CHECK (eh_membro_ong());

DROP POLICY IF EXISTS "ong_le_adocoes" ON adocoes;
CREATE POLICY "ong_le_adocoes"
ON adocoes FOR SELECT TO authenticated
USING (eh_membro_ong());

DROP POLICY IF EXISTS "ong_atualiza_adocoes" ON adocoes;
CREATE POLICY "ong_atualiza_adocoes"
ON adocoes FOR UPDATE TO authenticated
USING (eh_membro_ong())
WITH CHECK (eh_membro_ong());

DROP POLICY IF EXISTS "ong_gerencia_fotos" ON storage.objects;
CREATE POLICY "ong_gerencia_fotos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-animais' AND eh_membro_ong())
WITH CHECK (bucket_id = 'fotos-animais' AND eh_membro_ong());
