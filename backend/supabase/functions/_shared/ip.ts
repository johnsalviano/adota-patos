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
      if (!privido) return ip
    }
  }
  return 'desconhecido'
}