-- ============================================================
-- ADOTA PATOS — Migration 007: protecao real do storage de fotos
-- ------------------------------------------------------------
-- O que faz:
--   1. Trava o bucket "fotos-animais" nos MESMOS formatos que a
--      interface promete (JPEG, PNG, WebP)
--   2. Trava o bucket no MESMO tamanho que a interface promete (5 MB)
--
-- Por que:
--   O campo accept="..." e a checagem de file.size no painel sao
--   validacoes de CLIENTE: qualquer um chamando a API do Supabase
--   direto burla as duas. Sem isto no bucket, o storage aceitaria
--   qualquer tipo e qualquer tamanho.
--
--   Evidencia do problema: em 28/08/2026 entraram 2 arquivos .avif
--   no bucket, porque o accept="image/*" antigo permitia AVIF. O
--   contrato da interface nunca includeu AVIF.
--
-- Efeito colateral esperado:
--   allowed_mime_types e file_size_limit valem para ENVIOS novos e
--   atualizacoes. Os 2 .avif que ja existem continuam legiveis pela
--   URL publica (nenhum animal para de aparecer no site).
--
-- Como aplicar: cole no SQL Editor do projeto no Supabase.
-- ============================================================

-- Bucket = pasta onde ficam as fotos dos animais.
-- 5242880 bytes = 5 MB (mesmo valor de TAMANHO_MAX_FOTO no painel).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit    = 5242880
WHERE id = 'fotos-animais';

-- Conferindo: deve voltar 3 mime types e 5242880 de limite.
-- SELECT allowed_mime_types, file_size_limit
--   FROM storage.buckets WHERE id = 'fotos-animais';
