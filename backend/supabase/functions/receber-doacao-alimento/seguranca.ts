// ============================================================
// SEGURANÇA — identidade da requisição, rate limit e auditoria
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Limite individual por IP. No banco (tabela rate_limit_envios) porque a
// função roda em várias instâncias — cada uma com memória própria, o que
// furaria o limite. Todas enxergam a mesma caderneta.
export const LIMITE_POR_MINUTO = 5
// Teto global: mesmo com IP forjado, todas as requisições somam aqui.
export const LIMITE_GLOBAL_POR_MINUTO = 60

// Usa a versão compartilhada (corrigida) para evitar divergências.
export { ipDaRequisicao } from '../_shared/ip.ts'
export { registrarLog } from '../_shared/log.ts'