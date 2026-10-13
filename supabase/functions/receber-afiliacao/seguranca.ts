// ============================================================
// SEGURANÇA — identidade da requisição, rate limit e auditoria
// ============================================================

// Limite individual por IP por categoria. No banco (tabela rate_limit_envios_v2)
// porque a função roda em várias instâncias — cada uma com memória própria, o que
// furaria o limite. Todas enxergam a mesma caderneta.
export const LIMITE_POR_MINUTO = 5

// Usa a versão compartilhada (corrigida) para evitar divergências.
export { ipDaRequisicao } from '../_shared/ip.ts'
export { registrarLog } from '../_shared/log.ts'