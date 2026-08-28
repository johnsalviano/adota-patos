// Origem e JS continuam separados — seria bom separar CSS/JS em arquivos,
// mas sobre o backend segue:

// ============================================================
// CORS — origens autorizadas a chamar esta função
// ============================================================

export const ORIGENS_PERMITIDAS = new Set([
  'http://localhost:8788', // ambiente de testes local
])

export function corsPara(origem: string | null): Record<string, string> {
  const base = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (origem && ORIGENS_PERMITIDAS.has(origem)) {
    return { ...base, 'Access-Control-Allow-Origin': origem }
  }
  return base
}