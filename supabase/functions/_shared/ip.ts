// ============================================================
// IP REAL DA REQUISIÇÃO (compartilhado)
// ------------------------------------------------------------
// Fonte única da identificação de cliente. As funções rodam em
// várias instâncias, então a caderneta de rate limit precisa
// viver no banco, mas a extração do IP precisa ser idêntica em
// todas, senão o mesmo cliente passa a contar em chaves
// diferentes.
// ============================================================

// IP real do cliente segundo o Cloudflare (não forjável pelo cliente).
// NOTA: cf-connecting-ip é definido pelo Cloudflare na borda da rede.
// Se a Edge Function rodar atrás do Cloudflare (configuração padrão
// do Supabase), este cabeçalho é confiável. Caso contrário, cai-se
// no fallback x-forwarded-for com validação estrita.
export function ipDaRequisicao(req: Request): string {
  // 1. cf-connecting-ip: definido pelo Cloudflare, não forjável pelo cliente
  // quando a requisição passa pelo proxy do Cloudflare.
  const cf = req.headers.get('cf-connecting-ip')
  if (cf && isPublicIP(cf)) return cf

  // 2. x-forwarded-for: pode ser forjado pelo cliente.
  // Só usamos se NÃO houver cf-connecting-ip (ex: desenvolvimento local
  // sem Cloudflare). Varremos da direita para a esquerda pulando privados.
  const cadeia = req.headers.get('x-forwarded-for')
  if (cadeia) {
    const candidatos = cadeia.split(',').map((ip) => ip.trim())
    for (let i = candidatos.length - 1; i >= 0; i--) {
      const ip = candidatos[i]
      if (isPublicIP(ip)) return ip
    }
  }

  // 3. Fallback: nenhum IP público verificável.
  // Em produção com Cloudflare, este caminho NUNCA deve ser atingido.
  // Retornamos identificador fixo 'unknown' para não criar chave compartilhada
  // 'desconhecido' que permitiria DoS cruzado, mas também não geramos UUID
  // por requisição que permitiria burlar o rate limit.
  // Em produção, esta rota não deve ser atingida (Cloudflare sempre injeta cf-connecting-ip).
  return 'unknown'
}

// Verifica se um IP (IPv4, IPv6 ou IPv4-mapeado-em-IPv6) é público/roteável.
function isPublicIP(ip: string): boolean {
  if (!ip) return false

  // IPv4 mapeado em IPv6: ::ffff:192.168.1.1 -> extrai IPv4 interno
  const ipv4Mapeado = ip.match(/^::ffff:(.+)$/i)
  const ipParaTestar = ipv4Mapeado ? ipv4Mapeado[1] : ip

  // IPv4
  if (ipParaTestar.includes('.')) {
    return isPublicIPv4(ipParaTestar)
  }

  // IPv6
  if (ipParaTestar.includes(':')) {
    return isPublicIPv6(ipParaTestar)
  }

  return false
}

function isPublicIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) return false

  const [a, b] = parts

  // Privados RFC 1918
  if (a === 10) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false

  // Loopback
  if (a === 127) return false

  // Link-local
  if (a === 169 && b === 254) return false

  // Multicast
  if (a >= 224 && a <= 239) return false

  // Reservado / futuro
  if (a >= 240) return false

  // 0.0.0.0/8
  if (a === 0) return false

  return true
}

function isPublicIPv6(ip: string): boolean {
  // Normaliza: remove zone ID se houver (%eth0)
  const cleanIP = ip.split('%')[0].toLowerCase()

  // Loopback
  if (cleanIP === '::1') return false

  // IPv4-mapeado (já tratado antes, mas por segurança)
  if (cleanIP.startsWith('::ffff:')) {
    return isPublicIPv4(cleanIP.slice(7))
  }

  // Unspecified
  if (cleanIP === '::') return false

  // Primeiro hextet para validações de prefixo
  const firstHextet = cleanIP.split(':')[0]
  const firstHextetNum = parseInt(firstHextet, 16)

  // Unique Local Addresses (ULA) - fc00::/7 (fc00-fdff)
  if (firstHextetNum >= 0xfc00 && firstHextetNum <= 0xfdff) return false

  // Link-local - fe80::/10 (fe80-febf)
  if (firstHextetNum >= 0xfe80 && firstHextetNum <= 0xfebf) return false

  // Multicast - ff00::/8
  if (cleanIP.startsWith('ff')) return false

  // Documentation - 2001:db8::/32
  if (cleanIP.startsWith('2001:db8:')) return false

  return true
}