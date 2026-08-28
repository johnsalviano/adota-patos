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

// IP real do cliente segundo o Cloudflare (não forjável pelo cliente).
export function ipDaRequisicao(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf

  // A cadeia x-forwarded-for mistura IPs falsos na frente e saltos internos
  // atrás. O único confiável é o último IP público — varremos da direita
  // para a esquerda pulando faixas privadas/loopback.
  const cadeia = req.headers.get('x-forwarded-for')
  if (cadeia) {
    const candidatos = cadeia.split(',').map((ip) => ip.trim())
    for (let i = candidatos.length - 1; i >= 0; i--) {
      const ip = candidatos[i]
      const privado =
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|::1|f[cd][0-9a-f]{2}:|fe80:)/i
          .test(ip)
      if (!privado) return ip
    }
  }
  return 'desconhecido'
}

// Registra eventos suspeitos para a equipe investigar depois. Se o próprio
// log falhar, não atrapalhamos a resposta ao usuário — só avisamos no console.
export async function registrarLog(
  supabase: ReturnType<typeof createClient>,
  evento: string,
  ip: string,
  detalhe?: string,
): Promise<void> {
  const { error } = await supabase
    .from('log_seguranca')
    .insert({ evento, ip, detalhe })

  if (error) {
    console.error('Falha ao gravar log de segurança:', error.message)
  }
}