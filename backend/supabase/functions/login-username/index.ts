import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, mensagem: 'Metodo nao permitido.' }, 405, cors)

  try {
    const corpo = await req.json()
    const username = String(corpo.username ?? '').trim()
    const senha = String(corpo.password ?? '').trim()

    if (!username || !senha) {
      return json({ ok: false, mensagem: 'Login e senha sao obrigatorios.' }, 400, cors)
    }

    const chaveServidor =
      Deno.env.get('CHAVE_SERVIDOR') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseServer = createClient(
      Deno.env.get('SUPABASE_URL')!,
      chaveServidor!,
    )

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
