// ============================================================
// ADOTA PATOS — Função: receber-doacao-outro
// ------------------------------------------------------------
// Porta de entrada oficial do formulário de outras doações.
// Valida os dados, confere consentimento LGPD e grava a solicitação.
// Endpoint público (POST): /functions/v1/receber-doacao-outro
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsPara } from './cors.ts'
import { validarDados, TERMO_VERSAO } from './validar.ts'
import {
  ipDaRequisicao,
  registrarLog,
  LIMITE_POR_MINUTO,
} from './seguranca.ts'

function json(
  corpo: unknown,
  status: number,
  cors: Record<string, string>,
  extra?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      // Nunca cachear respostas de formulário: dados podem mudar
      // (LGPD) e o conteúdo varia por chamada.
      'Cache-Control': 'no-store',
      ...extra,
    },
  })
}

Deno.serve(async (req: Request) => {
  const cors = corsPara(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (req.method !== 'POST') {
    return json(
      { ok: false, mensagem: 'Método não permitido.' },
      405,
      cors,
      { Allow: 'POST, OPTIONS' },
    )
  }

  try {
    // Formulário legítimo tem ~1 KB; proíbe corpos gigantes.
    if (Number(req.headers.get('content-length') ?? 0) > 10_000) {
      return json(
        {
          ok: false,
          mensagem: 'Os dados enviados estão grandes demais. Revise as respostas e tente de novo.',
        },
        413,
        cors,
      )
    }

    // Chave privada do servidor (nunca exposta ao site).
    const chaveServidor =
      Deno.env.get('CHAVE_SERVIDOR') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, chaveServidor!)

    // Rate limit: protege contra envios automáticos.
    // Extrai IP confiável. Falha explícita se não houver IP verificável
    // (evita 'unknown' compartilhado ou UUID único que burla limite).
    let ip: string
    try {
      ip = ipDaRequisicao(req)
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('IP_CONFIÁVEL_INDISPONÍVEL')) {
        return json(
          { ok: false, mensagem: 'Não foi possível identificar a origem da requisição.' },
          429,
          cors,
        )
      }
      throw e
    }

    const { data: dentroDoLimite, error: erroLimite } = await supabase.rpc(
      'registrar_envio_v2',
      {
        p_ip: ip,
        p_categoria: 'doacao',
        p_limite: LIMITE_POR_MINUTO,
      },
    )

    if (erroLimite) {
      console.error('Falha ao consultar limite de envios:', erroLimite.message)
      return json(
        {
          ok: false,
          mensagem: 'Estamos com instabilidade neste momento. Por favor, tente novamente em alguns minutos.',
        },
        503,
        cors,
      )
    }

    if (dentroDoLimite === false) {
      await registrarLog(
        supabase,
        'rate_limit_estourado',
        ip,
        'Mais de 5 envios em 1 minuto',
      )
      return json(
        {
          ok: false,
          mensagem: 'Recebemos muitos envios seguidos deste endereço. Aguarde alguns minutinhos e tente de novo.',
        },
        429,
        cors,
      )
    }

    const dados = await req.json()

    // Honeypot: campo escondido que humanos nunca preenchem. Se chegou
    // preenchido, quase certeza de robô — respondemos "sucesso" falso.
    if (typeof dados['website'] === 'string' && dados['website'].trim() !== '') {
      console.warn('Honeypot acionado — envio descartado.')
      await registrarLog(
        supabase,
        'honeypot_acionado',
        ip,
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
      nome: String(dados.doadorNomeOutro).trim(),
      telefone: String(dados.doadorTelefoneOutro).trim(),
      email: String(dados.doadorEmailOutro).trim().toLowerCase(),
      cidade: String(dados.doadorCidadeOutro).trim(),
      outro_descricao: String(dados.outroDescricao).trim(),
      consentimento_lgpd: true,
      termo_versao: TERMO_VERSAO,
    }

    const { error } = await supabase.from('doacoes_outros').insert(registro)

    if (error) {
      console.error('Erro ao gravar solicitação:', error.message)
      return json(
        {
          ok: false,
          mensagem: 'Não conseguimos registrar sua solicitação neste momento. Por favor, tente novamente em alguns minutos.',
        },
        500,
        cors,
      )
    }

    return json(
      {
        ok: true,
        mensagem: 'Oferta de doação registrada com sucesso! A equipe da Adota Patos vai entrar em contato para combinar a entrega.',
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
}