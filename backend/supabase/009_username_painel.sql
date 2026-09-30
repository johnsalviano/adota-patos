-- ============================================================
-- ADOTA PATOS - Migration 009: username do membro autenticado
-- ------------------------------------------------------------
-- O painel mostra "Você está logado como <username>". A sessao do
-- Supabase Auth carrega e-mail, e nao o username, entao a tela
-- exibia o identificador interno em vez do nome de login.
--
-- perfis_membros tem RLS ligado e nenhuma policy, ou seja, nenhuma
-- leitura direta pela sessao. Esta funcao devolve SOMENTE o username
-- da propria conta, resolvido por auth.uid(), que e o id do perfil.
--
-- Nao abre leitura geral da tabela: um membro so enxerga a si mesmo,
-- e apenas a coluna username. O UUID e o e-mail ficam dentro da
-- funcao e nunca saem.
-- ============================================================

CREATE OR REPLACE FUNCTION meu_username()
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

COMMENT ON FUNCTION meu_username() IS
'Username do membro autenticado. SECURITY DEFINER porque perfis_membros fica trancada por RLS; o filtro por auth.uid() garante que cada um so veja o proprio username.';