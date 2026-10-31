// ============================================================
// ADOTA PATOS — Função: receber-doacao-monetaria
// ------------------------------------------------------------
// Porta de entrada oficial de doações monetárias.
// Valida os dados, confere consentimento LGPD e grava a solicitação.
// Endpoint público (POST): /functions/v1/receber-doacao-monetaria
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsPara } from '../_shared/cors.ts';
import { validarDados, TERMO_VERSAO } from './validar.ts';
import { validarContentTypeOuErro } from '../_shared/content-type.ts';
import { registrarLog } from '../_shared/log.ts';
import { ipDaRequisicao, LIMITE_POR_MINUTO } from './seguranca.ts';

function json(corpo: unknown, status: number, cors: Record<string, string>, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      ...extra,
    },
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsPara(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...cors,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return json(
      { ok: false, mensagem: 'Método não permitido.' },
      405,
      cors,
      { Allow: 'POST, OPTIONS' }
    );
  }

  // CSRF: exige Content-Type application/json
  const erroContentType = validarContentTypeOuErro(req, cors, json);
  if (erroContentType) return erroContentType;

  // Initialize Supabase client with service role key (server-side only)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('CHAVE_SERVIDOR')!,
  );

  // Rate limit: protege contra envios automáticos
  const ip = ipDaRequisicao(req);
  const { data: dentroDoLimite, error: erroLimite } = await supabase.rpc(
    'registrar_envio_v2',
    {
      p_ip: ip,
      p_categoria: 'doacao',
      p_limite: LIMITE_POR_MINUTO,
    },
  );

  if (erroLimite) {
    console.error('Falha ao consultar limite de envios:', erroLimite.message);
    return json(
      {
        ok: false,
        mensagem: 'Estamos com instabilidade neste momento. Por favor, tente novamente em alguns minutos.',
      },
      503,
      cors,
    );
  };

  if (dentroDoLimite === false) {
    await registrarLog(
      supabase,
      'rate_limit_estourado',
      ip,
      'Mais de 5 envios em 1 minuto',
    );
    return json(
      {
        ok: false,
        mensagem: 'Recebemos muitos envios seguidos deste endereço. Aguarde alguns minutinhos e tente de novo.',
      },
      429,
      cors,
    );
  }

  const dados = await req.json();

  // Honeypot: campo escondido que humanos nunca preenchem
  if (typeof dados['website'] === 'string' && dados['website'].trim() !== '') {
    await registrarLog(
      supabase,
      'honeypot_acionado',
      ip,
      String(dados['website']).slice(0, 200),
    );
    return json(
      { ok: true, mensagem: 'Solicitação enviada com sucesso!' },
      200,
      cors,
    );
  }

  const erros = validarDados(dados);
  if (erros.length > 0) {
    return json(
      {
        ok: false,
        mensagem: 'Quase lá! Revise os itens abaixo para concluir sua solicitação:',
        erros,
      },
      400,
      cors,
    );
  }

  const registro: Record<string, unknown> = {
    nome: String(dados.nome).trim(),
    telefone: String(dados.telefone).trim(),
    email: String(dados.email).trim().toLowerCase(),
    cidade: String(dados.cidade).trim(),
    valor: Number(dados.valor),
    metodo: String(dados.metodo),
    referencia: String(dados.referencia).trim(),
    status: 'solicitada',
    confirmado_por: null,
    confirmado_em: null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('doacoes_monetarias').insert(registro);
  if (error) {
    console.error('Erro ao gravar solicitação:', error.message);
    return json(
      {
        ok: false,
        mensagem: 'Não conseguimos registrar sua solicitação neste momento. Por favor, tente novamente em alguns minutos.',
      },
      500,
      cors,
    );
  }

  return json(
    {
      ok: true,
      mensagem: 'Solicitação de doação monetária registrada com sucesso! A equipe da Adota Patos entrará em contato para confirmar o pagamento.',
    },
    200,
    cors,
  );
});

