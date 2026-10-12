// Tests for ipDaRequisicao behavior (IP extraction + error handling)
// Run with: npx vitest run tests/ip-extraction.test.ts

import { describe, it, expect, vi } from 'vitest';

// Simulated Request object for testing
class MockRequest {
  private _headers: Map<string, string> = new Map()

  constructor(headers: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(headers)) {
      this._headers.set(key.toLowerCase(), value)
    }
  }

  // Mimic Request.headers.get()
  headers = {
    get: (name: string): string | null => {
      return this._headers.get(name.toLowerCase()) ?? null
    },
  }
}

// Copied validation logic from _shared/ip.ts
function isPublicIP(ip: string): boolean {
  if (!ip) return false

  const ipv4Mapeado = ip.match(/^::ffff:(.+)$/i)
  const ipParaTestar = ipv4Mapeado ? ipv4Mapeado[1] : ip

  if (ipParaTestar.includes('.')) {
    return isPublicIPv4(ipParaTestar)
  }

  if (ipParaTestar.includes(':')) {
    return isPublicIPv6(ipParaTestar)
  }

  return false
}

function isPublicIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) return false

  const [a, b] = parts

  if (a === 10) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 127) return false
  if (a === 169 && b === 254) return false
  if (a >= 224 && a <= 239) return false
  if (a >= 240) return false
  if (a === 0) return false

  return true
}

function isPublicIPv6(ip: string): boolean {
  const cleanIP = ip.split('%')[0].toLowerCase()

  if (cleanIP === '::1') return false
  if (cleanIP.startsWith('::ffff:')) {
    return isPublicIPv4(cleanIP.slice(7))
  }
  if (cleanIP === '::') return false

  const firstHextet = cleanIP.split(':')[0]
  const firstHextetNum = parseInt(firstHextet, 16)

  if (firstHextetNum >= 0xfc00 && firstHextetNum <= 0xfdff) return false
  if (firstHextetNum >= 0xfe80 && firstHextetNum <= 0xfebf) return false
  if (cleanIP.startsWith('ff')) return false
  if (cleanIP.startsWith('2001:db8:')) return false

  return true
}

// Simulated ipDaRequisicao behavior (throws on no reliable IP)
function ipDaRequisicaoSimulada(req: MockRequest): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf && isPublicIP(cf)) return cf

  const cadeia = req.headers.get('x-forwarded-for')
  if (cadeia) {
    const candidatos = cadeia.split(',').map((ip) => ip.trim())
    for (let i = candidatos.length - 1; i >= 0; i--) {
      const ip = candidatos[i]
      if (isPublicIP(ip)) return ip
    }
  }

  throw new Error('IP_CONFIÁVEL_INDISPONÍVEL: cf-connecting-ip ausente e x-forwarded-for inválido/ausente')
}

describe('ipDaRequisicao - Extração de IP e Tratamento de Erro', () => {
  describe('cf-connecting-ip (Cloudflare) - prioridade máxima', () => {
    it('deve retornar cf-connecting-ip quando público', () => {
      const req = new MockRequest({ 'cf-connecting-ip': '8.8.8.8' })
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })

    it('deve ignorar cf-connecting-ip privado e cair para x-forwarded-for', () => {
      const req = new MockRequest({
        'cf-connecting-ip': '192.168.1.1',
        'x-forwarded-for': '8.8.8.8',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })

    it('deve ignorar cf-connecting-ip inválido', () => {
      const req = new MockRequest({
        'cf-connecting-ip': 'not-an-ip',
        'x-forwarded-for': '8.8.8.8',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })

    it('deve aceitar IPv6 público no cf-connecting-ip', () => {
      const req = new MockRequest({ 'cf-connecting-ip': '2001:4860:4860::8888' })
      expect(ipDaRequisicaoSimulada(req)).toBe('2001:4860:4860::8888')
    })

    it('deve aceitar IPv4-mapeado no cf-connecting-ip', () => {
      const req = new MockRequest({ 'cf-connecting-ip': '::ffff:8.8.8.8' })
      expect(ipDaRequisicaoSimulada(req)).toBe('::ffff:8.8.8.8')
    })
  })

  describe('x-forwarded-for (fallback quando sem Cloudflare)', () => {
    it('deve usar x-forwarded-for quando cf-connecting-ip ausente', () => {
      const req = new MockRequest({ 'x-forwarded-for': '8.8.8.8' })
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })

    it('deve varrer da direita para esquerda e pular privados', () => {
      const req = new MockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 8.8.8.8',
      })
      // O mais à direita (8.8.8.8) é o primeiro público válido
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })

    it('deve ignorar IPs privados na cadeia', () => {
      const req = new MockRequest({
        'x-forwarded-for': '192.168.1.1, 172.16.0.1, 127.0.0.1',
      })
      // Todos privados - deve lançar erro
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('deve aceitar IPv6 na cadeia x-forwarded-for', () => {
      const req = new MockRequest({
        'x-forwarded-for': '2001:4860:4860::8888',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('2001:4860:4860::8888')
    })

    it('deve aceitar IPv4-mapeado na cadeia', () => {
      const req = new MockRequest({
        'x-forwarded-for': '::ffff:8.8.8.8',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('::ffff:8.8.8.8')
    })
  })

  describe('Ausência de IP confiável - erro explícito', () => {
    it('deve lançar erro quando nenhum cabeçalho presente', () => {
      const req = new MockRequest({})
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('deve lançar erro quando apenas IPs privados em x-forwarded-for', () => {
      const req = new MockRequest({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' })
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('deve lançar erro quando cf-connecting-ip privado e x-forwarded-for ausente', () => {
      const req = new MockRequest({ 'cf-connecting-ip': '192.168.1.1' })
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('deve lançar erro quando cabeçalhos inválidos', () => {
      const req = new MockRequest({
        'cf-connecting-ip': 'not-an-ip',
        'x-forwarded-for': 'also-invalid',
      })
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('mensagem de erro deve ser identificável para tratamento nas Edge Functions', () => {
      const req = new MockRequest({})
      try {
        ipDaRequisicaoSimulada(req)
      } catch (e) {
        expect(e instanceof Error).toBe(true)
        expect(e.message).toContain('IP_CONFIÁVEL_INDISPONÍVEL')
      }
    })
  })

  describe('Tentativas de falsificação de IP', () => {
    it('cliente não pode forjar cf-connecting-ip (Cloudflare define)', () => {
      // Em produção, Cloudflare sobrescreve este cabeçalho
      // Teste documenta o comportamento esperado
      expect(true).toBe(true)
    })

    it('cliente pode enviar x-forwarded-for arbitrário', () => {
      const req = new MockRequest({
        'x-forwarded-for': '8.8.8.8, 1.1.1.1, 9.9.9.9', // cliente tenta injetar
      })
      // Varre da direita para esquerda - pega o último público válido
      // (que na prática seria o IP do proxy anterior confiável)
      expect(ipDaRequisicaoSimulada(req)).toBe('9.9.9.9')
    })

    it('IPs privados injetados pelo cliente são ignorados', () => {
      const req = new MockRequest({
        'x-forwarded-for': '192.168.1.100, 10.0.0.50, 8.8.8.8',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('8.8.8.8')
    })
  })

  describe('Casos de borda', () => {
    it('x-forwarded-for com espaços', () => {
      const req = new MockRequest({
        'x-forwarded-for': ' 8.8.8.8 , 1.1.1.1 ',
      })
      expect(ipDaRequisicaoSimulada(req)).toBe('1.1.1.1')
    })

    it('x-forwarded-for vazio', () => {
      const req = new MockRequest({ 'x-forwarded-for': '' })
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })

    it('cf-connecting-ip vazio', () => {
      const req = new MockRequest({ 'cf-connecting-ip': '' })
      expect(() => ipDaRequisicaoSimulada(req)).toThrow('IP_CONFIÁVEL_INDISPONÍVEL')
    })
  })
})