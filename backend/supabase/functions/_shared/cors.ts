// ============================================================
// CORS — origens autorizadas (compartilhado)
// ------------------------------------------------------------
// Allowlist de CORS da função login-username, que antes respondia
// com "*" para qualquer origem e permitia chamar o endpoint de
// senha a partir de qualquer site.
//
// As origens são as mesmas de receber-adocao/cors.ts, mas as duas
// funções são publicadas separadamente e cada uma tem a sua
// cópia: receber-adocao continua usando o cors.ts dela, porque
// mexer nela estava fora do escopo desta correção. Alterar uma
// origem significa alterar os dois arquivos.
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