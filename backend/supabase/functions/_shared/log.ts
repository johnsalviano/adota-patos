// ============================================================
// DIÁRIO DE SEGURANÇA (compartilhado)
// ------------------------------------------------------------
// Grava evento suspeito em log_seguranca para a equipe investigar
// depois. Se o próprio log falhar, não atrapalhamos a resposta ao
// usuário — só avisamos no console.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function registrarLog(
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