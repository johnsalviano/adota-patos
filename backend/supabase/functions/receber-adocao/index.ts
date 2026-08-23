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
// Endpoint público (POST):
//   https://<projeto>.supabase.co/functions/v1/receber-adocao
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Permite que o site (de qualquer origem) consiga chamar esta função.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Campos obrigatórios: [chave recebida, mensagem amigável]
const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['nome', 'o seu nome'],
  ['telefone', 'um telefone para contato'],
  ['email', 'o seu e-mail'],
  ['cidade', 'a cidade onde você mora'],
  ['experiencia', 'se você já teve experiências com animais'],
  ['motivo', 'o motivo pelo qual quer adotar'],
]

function json(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

  const email = dados['email']
  if (typeof email === 'string' && email.trim() !== '' && !email.includes('@')) {
    erros.push('O e-mail informado não parece válido.')
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
  // Navegadores mandam um "OPTIONS" antes do POST real (CORS).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, mensagem: 'Método não permitido.' }, 405)
  }

  try {
    const dados = await req.json()
    const erros = validarDados(dados)

    if (erros.length > 0) {
      return json(
        {
          ok: false,
          mensagem: 'Quase lá! Revise os itens abaixo para concluir sua solicitação:',
          erros,
        },
        400,
      )
    }

    // Chave privada do servidor (nunca exposta ao site).
    const chaveServidor =
      Deno.env.get('CHAVE_SERVIDOR') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, chaveServidor!)

    const registro: Record<string, unknown> = {
      nome: String(dados.nome).trim(),
      telefone: String(dados.telefone).trim(),
      email: String(dados.email).trim().toLowerCase(),
      cidade: String(dados.cidade).trim(),
      experiencia: String(dados.experiencia).trim(),
      motivo: String(dados.motivo).trim(),
      status: 'Pendente',
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
      )
    }

    return json(
      {
        ok: true,
        mensagem:
          'Solicitação enviada com sucesso! A equipe da Adota Patos vai analisar com carinho e entrar em contato.',
      },
      200,
    )
  } catch {
    return json(
      { ok: false, mensagem: 'Não conseguimos entender os dados enviados.' },
      400,
    )
  }
})
