// ============================================================
// CORS — origens autorizadas a chamar esta função
// ============================================================

export const ORIGENS_PERMITIDAS = new Set([
  'http://localhost:8788', // teste local servindo o frontend
  'https://johnsalviano.github.io', // site publicado (GitHub Pages)
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