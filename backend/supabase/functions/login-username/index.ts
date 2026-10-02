// ============================================================
// ADOTA PATOS — Função: login-username
// ------------------------------------------------------------
// Autenticação do painel da ONG a partir de username + senha.
// Traduz o username em e-mail e delega a checagem ao Supabase
// Auth, preservando a sessão oficial.
//
// Endpoint público (POST): /functions/v1/login-username
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsPara } from '../_shared/cors.ts'
import { ipDaRequisicao } from '../_shared/ip.ts'
import { registrarLog } from '../_shared/log.ts'

// Política de tentativas de login. Janela curta (1 minuto na
// função registrar_envio) e teto modesto: contenção de tentativa
// automatizada sem travar a pessoa que digita a senha duas vezes
// errado. Nada de bloqueio permanente — a caderneta zera sozinha.
// Chave própria ('login:' + ip) para não compartilhar a
// caderneta com o formulário de adoção.
const LIMITE_TENTATIVAS_POR_MINUTO = 10
// Teto global, igual ao da adoção. registrar_envio tem duas
// sobrecargas, e o PostgREST só desambigua se os três parâmetros
// vierem nomeados: omitir p_limite_global devolve PGRST203.
const LIMITE_GLOBAL_POR_MINUTO = 60

function json(corpo: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

Deno.serve(async (req: Request) => {
  const cors = corsPara(req.headers.get('origin'))

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return json({ ok: false, mensagem: 'Metodo nao permitido.' }, 405, cors)
  }

  try {
    // Chave privada do servidor (nunca exposta ao site).
    const chaveServidor =
      Deno.env.get('CHAVE_SERVIDOR') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseServer = createClient(
      Deno.env.get('SUPABASE_URL')!,
      chaveServidor!,
    )

    const ip = ipDaRequisicao(req)

    // Rate limit antes de qualquer trabalho: se estourou, nem
    // chegamos a consultar o banco de membros.
    const { data: dentroDoLimite, error: erroLimite } = await supabaseServer.rpc(
      'registrar_envio',
      {
        p_ip: `login:${ip}`,
        p_limite: LIMITE_TENTATIVAS_POR_MINUTO,
        p_limite_global: LIMITE_GLOBAL_POR_MINUTO,
      },
    )

    if (erroLimite) {
      console.error('Falha ao consultar limite de tentativas:', erroLimite.message)
      return json({ ok: false, mensagem: 'Nao foi possivel processar o login.' }, 500, cors)
    }

    if (dentroDoLimite === false) {
      await registrarLog(
        supabaseServer,
        'rate_limit_login',
        ip,
        `Mais de ${LIMITE_TENTATIVAS_POR_MINUTO} tentativas de login em 1 minuto`,
      )
      // Mesma mensagem genérica de credencial inválida: o
      // atacante não ganha informação sobre existir ou não a conta.
      return json({ ok: false, mensagem: 'Login ou senha incorretos.' }, 401, cors)
    }

    const corpo = await req.json()
    const username = String(corpo.username ?? '').trim()
    const senha = String(corpo.password ?? '').trim()

    if (!username || !senha) {
      return json({ ok: false, mensagem: 'Login ou senha incorretos.' }, 400, cors)
    }

    // Busca email associado ao username (sem expor email na resposta de erro)
    const { data: membro, error: erroBusca } = await supabaseServer
      .from('perfis_membros')
      .select('email')
      .eq('username', username)
      .single()

    if (erroBusca || !membro) {
      return json({ ok: false, mensagem: 'Login ou senha incorretos.' }, 401, cors)
    }

    // Autenticacao real via cliente public (preserva Supabase Auth)
    const chavePublica =
      'sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR'
    const supabasePublic = createClient(
      Deno.env.get('SUPABASE_URL')!,
      chavePublica,
    )

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email: membro.email,
      password: senha,
    })

    if (error || !data.session) {
      return json({ ok: false, mensagem: 'Login ou senha incorretos.' }, 401, cors)
    }

    return json(
      {
        ok: true,
        mensagem: 'Acesso autorizado.',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      200,
      cors,
    )
  } catch {
    return json({ ok: false, mensagem: 'Nao foi possivel processar o login.' }, 500, cors)
  }
})
