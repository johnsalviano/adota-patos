// Unit tests for IP validation (isPublicIP, isPublicIPv4, isPublicIPv6)
// Run with: npx vitest run tests/ip-validation.test.ts

import { describe, it, expect } from 'vitest';

// Copied from _shared/ip.ts for testing
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

describe('isPublicIP', () => {
  describe('IPv4 públicos válidos', () => {
    it('deve aceitar IP público válido', () => {
      expect(isPublicIP('8.8.8.8')).toBe(true)
      expect(isPublicIP('1.1.1.1')).toBe(true)
      expect(isPublicIP('203.0.113.195')).toBe(true)
    })

    it('deve aceitar IPv4 mapeado em IPv6 público', () => {
      expect(isPublicIP('::ffff:8.8.8.8')).toBe(true)
      expect(isPublicIP('::ffff:1.1.1.1')).toBe(true)
    })
  })

  describe('IPv4 privados/inválidos rejeitados', () => {
    it('deve rejeitar 10.x.x.x (RFC 1918)', () => {
      expect(isPublicIP('10.0.0.1')).toBe(false)
      expect(isPublicIP('10.255.255.255')).toBe(false)
    })

    it('deve rejeitar 172.16-31.x.x (RFC 1918)', () => {
      expect(isPublicIP('172.16.0.1')).toBe(false)
      expect(isPublicIP('172.31.255.255')).toBe(false)
    })

    it('deve aceitar 172.15 e 172.32 (fora do range privado)', () => {
      expect(isPublicIP('172.15.0.1')).toBe(true)
      expect(isPublicIP('172.32.0.1')).toBe(true)
    })

    it('deve rejeitar 192.168.x.x (RFC 1918)', () => {
      expect(isPublicIP('192.168.0.1')).toBe(false)
      expect(isPublicIP('192.168.255.255')).toBe(false)
    })

    it('deve rejeitar 127.x.x.x (loopback)', () => {
      expect(isPublicIP('127.0.0.1')).toBe(false)
      expect(isPublicIP('127.255.255.255')).toBe(false)
    })

    it('deve rejeitar 169.254.x.x (link-local)', () => {
      expect(isPublicIP('169.254.0.1')).toBe(false)
      expect(isPublicIP('169.254.255.255')).toBe(false)
    })

    it('deve rejeitar multicast 224-239', () => {
      expect(isPublicIP('224.0.0.1')).toBe(false)
      expect(isPublicIP('239.255.255.255')).toBe(false)
    })

    it('deve rejeitar reservado 240+', () => {
      expect(isPublicIP('240.0.0.1')).toBe(false)
      expect(isPublicIP('255.255.255.255')).toBe(false)
    })

    it('deve rejeitar 0.0.0.0/8', () => {
      expect(isPublicIP('0.0.0.0')).toBe(false)
      expect(isPublicIP('0.255.255.255')).toBe(false)
    })

    it('deve rejeitar IPv4 mapeado em IPv6 privado', () => {
      expect(isPublicIP('::ffff:10.0.0.1')).toBe(false)
      expect(isPublicIP('::ffff:192.168.1.1')).toBe(false)
      expect(isPublicIP('::ffff:127.0.0.1')).toBe(false)
    })
  })

  describe('IPv6 públicos válidos', () => {
    it('deve aceitar IPv6 público válido', () => {
      expect(isPublicIP('2001:4860:4860::8888')).toBe(true)
      expect(isPublicIP('2606:4700:4700::1111')).toBe(true)
    })
  })

  describe('IPv6 privados/inválidos rejeitados', () => {
    it('deve rejeitar ::1 (loopback)', () => {
      expect(isPublicIP('::1')).toBe(false)
    })

    it('deve rejeitar :: (unspecified)', () => {
      expect(isPublicIP('::')).toBe(false)
    })

    it('deve rejeitar ULA fc00::/7', () => {
      expect(isPublicIP('fc00::1')).toBe(false)
      expect(isPublicIP('fd00::1')).toBe(false)
      expect(isPublicIP('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false)
    })

    it('deve rejeitar link-local fe80::/10', () => {
      expect(isPublicIP('fe80::1')).toBe(false)
      expect(isPublicIP('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false)
    })

    it('deve rejeitar multicast ff00::/8', () => {
      expect(isPublicIP('ff02::1')).toBe(false)
      expect(isPublicIP('ff00::1')).toBe(false)
    })

    it('deve rejeitar documentação 2001:db8::/32', () => {
      expect(isPublicIP('2001:db8::1')).toBe(false)
    })

    it('deve rejeitar IPv4-mapeado em IPv6 privado', () => {
      expect(isPublicIP('::ffff:192.168.1.1')).toBe(false)
    })
  })

  describe('Entradas inválidas', () => {
    it('deve rejeitar string vazia', () => {
      expect(isPublicIP('')).toBe(false)
    })

    it('deve rejeitar null/undefined', () => {
      expect(isPublicIP(null as any)).toBe(false)
      expect(isPublicIP(undefined as any)).toBe(false)
    })

    it('deve rejeitar formato inválido', () => {
      expect(isPublicIP('not-an-ip')).toBe(false)
      expect(isPublicIP('999.999.999.999')).toBe(false)
    })
  })
})

describe('isPublicIPv4', () => {
  it('deve validar corretamente octetos', () => {
    expect(isPublicIPv4('255.255.255.255')).toBe(false) // multicast/reservado
    expect(isPublicIPv4('0.0.0.0')).toBe(false)
    expect(isPublicIPv4('192.168.1.1')).toBe(false)
  })
})

describe('isPublicIPv6', () => {
  it('deve normalizar zone ID', () => {
    expect(isPublicIPv6('2001:db8::1%eth0')).toBe(false) // documentação
  })

  it('deve aceitar IPv6 com zone ID público', () => {
    expect(isPublicIPv6('2001:4860:4860::8888%eth0')).toBe(true)
  })
})