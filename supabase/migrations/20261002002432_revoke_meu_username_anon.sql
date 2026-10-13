-- ============================================================
-- ADOTA PATOS - Migration 010: fecha meu_username() para anon
-- ------------------------------------------------------------
-- O que faz:
--   Remove o privilegio EXECUTE de anon sobre public.meu_username().
--
-- Por que:
--   A funcao e SECURITY DEFINER: ela enxerga perfis_membros apesar do
--   RLS trancar a tabela. O linter do Supabase acusou que ela
--   respondia pelo endpoint publico /rest/v1/rpc/meu_username.
--
--   Hoje isso nao vaza nada: o corpo filtra por auth.uid(), que e
--   nulo para anon, entao a resposta e null. Mas a funcao privileged
--   nao precisa estar alcancavel por quem nao tem sessao. Se a
--   predicado mudar no futuro, o vazamento acontece sem nenhum
--   outro controle no caminho.
--
--   authenticated continua com acesso, porque e assim que o painel
--   usa: painel.js chama cliente.rpc('meu_username') depois que a
--   sessao do Supabase Auth esta ativa.
--
-- Impacto no painel:
--   Nenhum. O fluxo do painel ja e autenticado.
--
-- Como aplicar: cole no SQL Editor do projeto no Supabase.
-- ============================================================

-- Fecha para anon e para o papel publico (default do PostgreSQL).
REVOKE EXECUTE ON FUNCTION public.meu_username() FROM anon;
REVOKE EXECUTE ON FUNCTION public.meu_username() FROM PUBLIC;

-- Garante o caminho que o painel usa.
GRANT EXECUTE ON FUNCTION public.meu_username() TO authenticated;

-- Conferindo o resultado esperado:
--   anon          = false
--   authenticated = true
-- select has_function_privilege('anon', 'public.meu_username()', 'EXECUTE') as anon,
--        has_function_privilege('authenticated', 'public.meu_username()', 'EXECUTE') as autenticado;