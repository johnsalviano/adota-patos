// ============================================================
// 🐾 ADOTA PATOS — Função: receber-adocao
// ------------------------------------------------------------
// Recebe o formulário de adoção enviado pelo site, confere os
// campos obrigatórios e grava a solicitação na tabela `adocoes`.
//
// Por que ela existe?
// O visitante do site é anônimo e não tem permissão para gravar
// nada no banco. Esta função é a "porta de entrada oficial":
// valida os dados com carinho e registra a candidatura.
//
// Proteções incluídas (Issues #18 e #16):
//   • Consentimento LGPD obrigatório (art. 7º, I da Lei 13.709/2018);
//   • Lista branca de origens que podem chamar esta função;
//   • Honeypot contra robôs de spam;
//   • Limite de requisições por IP.
//
// Endpoint público (POST):
//   https://<projeto>.supabase.co/functions/v1/receber-adocao
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ------------------------------------------------------------
// CORS — lista branca de origens
// Só deixamos chamar esta função quem realmente usa ela:
// o site oficial e o ambiente de testes local.
// Quando o site ganhar o endereço definitivo (deploy), adicione
// a origem aqui (ex.: https://adotapatos.org.br).
// Clientes fora de um navegador (curl, Postman) ignoram CORS;
// para eles, quem protege é o limite de requisições abaixo.
// ------------------------------------------------------------
const ORIGENS_PERMITIDAS = new Set([
  'http://localhost:8788', // ambiente de testes local
])

function corsPara(origem: string | null): Record<string, string> {
  const base = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (origem && ORIGENS_PERMITIDAS.has(origem)) {
    return { ...base, 'Access-Control-Allow-Origin': origem }
  }
  return base
}

// ------------------------------------------------------------
// Limite de requisições (rate limit)
// O controle fica no banco (tabela rate_limit_envios), porque a
// função pode rodar em várias instâncias — e cada instância teria
// sua própria memória, o que furaria o limite. No banco, todas
// enxergam a mesma caderneta. A rotina diária de limpeza está na
// migração 004_rate_limit.sql.
// ------------------------------------------------------------
const LIMITE_POR_MINUTO = 5
// Teto global: mesmo que o atacante forje o cabeçalho de IP (diluíndo
// o limite individual), TODAS as requisições somam aqui. 60 por minuto
// dá folga enorme para o uso real de uma ONG e trava flood.
const LIMITE_GLOBAL_POR_MINUTO = 60

function ipDaRequisicao(req: Request): string {
  // IP real do cliente segundo o Cloudflare (nao forjavel pelo cliente).
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf

  // A cadeia x-forwarded-for mistura IPs falsos do atacante na frente e
  // saltos internos do gateway atras. O unico confiavel e o ultimo IP
  // PUBLICO da lista — por isso varremos da direita para a esquerda,
  // pulando faixas privadas/loopback que variam entre instancias.
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

// ------------------------------------------------------------
// Câmera de segurança: registra eventos suspeitos na tabela
// log_seguranca para a equipe investigar depois. Se o próprio
// registro do log falhar, não atrapalhamos a resposta ao usuário
// — apenas avisamos no console da função.
// ------------------------------------------------------------
async function registrarLog(
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

// Versão do texto de autorização aceito pelo candidato.
// Se um dia o texto mudar de forma relevante, suba a versão:
// isso preserva o histórico do que cada pessoa concordou.
const TERMO_VERSAO = 'v1-2026-08'

// Campos obrigatórios: [chave recebida, mensagem amigável]
const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['nome', 'o seu nome'],
  ['telefone', 'um telefone para contato'],
  ['email', 'o seu e-mail'],
  ['cidade', 'a cidade onde você mora'],
  ['experiencia', 'se você já teve experiências com animais'],
  ['motivo', 'o motivo pelo qual quer adotar'],
]

function json(corpo: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function validarDados(dados: Record<string, unknown>): string[] {
  const erros: string[] = []

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo]
    if (typeof valor !== 'string' || valor.trim() === '') {
      erros.push(`Conte para nós ${rotulo}.`)
    }
  }

  // E-mail precisa ter formato nome@dominio.sufixo.
  const email = dados['email']
  if (
    typeof email === 'string' &&
    email.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    erros.push('O e-mail informado não parece válido.')
  }

  // Limites de tamanho: ninguém escreve um romance no campo "nome",
  // e limitar impede que textos gigantes sobrecarreguem o banco.
  const LIMITES_DE_TAMANHO: Array<[string, number]> = [
    ['nome', 80],
    ['telefone', 15],
    ['email', 100],
    ['cidade', 40],
    ['experiencia', 60],
    ['motivo', 300],
  ]
  for (const [campo, maximo] of LIMITES_DE_TAMANHO) {
    const valor = dados[campo]
    if (typeof valor === 'string' && valor.length > maximo) {
      erros.push('Uma das respostas ficou muito longa. Resuma um pouco para continuar.')
      break
    }
  }

  if (dados['consentimento'] !== true) {
    erros.push('Precisamos da sua autorização para usar seus dados nesta solicitação.')
  }

  const animalId = dados['animal_id']
  if (
    animalId !== undefined &&
    animalId !== null &&
    animalId !== '' &&
    typeof animalId === 'string' &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animalId)
  ) {
    erros.push('Animal selecionado não encontrado.')
  }

  return erros
}

Deno.serve(async (req: Request) => {
  const cors = corsPara(req.headers.get('origin'))

  // Navegadores mandam um "OPTIONS" antes do POST real (CORS).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, mensagem: 'Método não permitido.' }, 405, cors)
  }

  try {
    // Corpos gigantes não passam: formulário legítimo tem ~1 KB.
    // Isso impede que alguém sobrecarregue a função com envios enormes.
    const tamanho = Number(req.headers.get('content-length') ?? 0)
    if (tamanho > 10_000) {
      return json(
        {
          ok: false,
          mensagem:
            'Os dados enviados estão grandes demais. Revise as respostas e tente de novo.',
        },
        413,
        cors,
      )
    }

    // Chave privada do servidor (nunca exposta ao site).
    const chaveServidor =
      Deno.env.get('CHAVE_SERVIDOR') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, chaveServidor!)

    // Limite de requisições: protege contra envios automáticos.
    const { data: dentroDoLimite, error: erroLimite } = await supabase.rpc(
      'registrar_envio',
      {
        p_ip: ipDaRequisicao(req),
        p_limite: LIMITE_POR_MINUTO,
        p_limite_global: LIMITE_GLOBAL_POR_MINUTO,
      },
    )

    if (erroLimite) {
      console.error('Falha ao consultar limite de envios:', erroLimite.message)
      return json(
        {
          ok: false,
          mensagem:
            'Estamos com instabilidade neste momento. Por favor, tente novamente em alguns minutos.',
        },
        503,
        cors,
      )
    }

    if (dentroDoLimite === false) {
      await registrarLog(
        supabase,
        'rate_limit_estourado',
        ipDaRequisicao(req),
        'Mais de 5 envios em 1 minuto',
      )
      return json(
        {
          ok: false,
          mensagem:
            'Recebemos muitos envios seguidos deste endereço. Aguarde alguns minutinhos e tente de novo.',
        },
        429,
        cors,
      )
    }

    const dados = await req.json()

    // Honeypot: campo escondido que humanos nunca veem ou preenchem.
    // Se chegou preenchido, é quase certeza de robô — respondemos
    // "sucesso" falso para não dar pistas, e gravamos nada.
    if (typeof dados['website'] === 'string' && dados['website'].trim() !== '') {
      console.warn('Honeypot acionado — envio descartado.')
      await registrarLog(
        supabase,
        'honeypot_acionado',
        ipDaRequisicao(req),
        String(dados['website']).slice(0, 200),
      )
      return json(
        { ok: true, mensagem: 'Solicitação enviada com sucesso!' },
        200,
        cors,
      )
    }

    const erros = validarDados(dados)

    if (erros.length > 0) {
      return json(
        {
          ok: false,
          mensagem: 'Quase lá! Revise os itens abaixo para concluir sua solicitação:',
          erros,
        },
        400,
        cors,
      )
    }

    const registro: Record<string, unknown> = {
      nome: String(dados.nome).trim(),
      telefone: String(dados.telefone).trim(),
      email: String(dados.email).trim().toLowerCase(),
      cidade: String(dados.cidade).trim(),
      experiencia: String(dados.experiencia).trim(),
      motivo: String(dados.motivo).trim(),
      status: 'Pendente',
      // Prova do consentimento expresso dado no formulário (LGPD).
      consentimento_lgpd: true,
      termo_versao: TERMO_VERSAO,
    }

    if (dados.animal_id) {
      registro.animal_id = dados.animal_id
    }

    const { error } = await supabase.from('adocoes').insert(registro)

    if (error) {
      console.error('Erro ao gravar solicitação:', error.message)
      return json(
        {
          ok: false,
          mensagem:
            'Não conseguimos registrar sua solicitação neste momento. Por favor, tente novamente em alguns minutos.',
        },
        500,
        cors,
      )
    }

    return json(
      {
        ok: true,
        mensagem:
          'Solicitação enviada com sucesso! A equipe da Adota Patos vai analisar com carinho e entrar em contato.',
      },
      200,
      cors,
    )
  } catch {
    return json(
      { ok: false, mensagem: 'Não conseguimos entender os dados enviados.' },
      400,
      cors,
    )
  }
})
