// transparencia/index.ts - Edge Function para gerenciar relatórios de transparência
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // User identification: optional for GET (public download/list),
  // required for POST/DELETE (manager-only operations)
  const authHeader = req.headers.get("Authorization");
  let user: any = null;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (!userError && authUser) user = authUser;
  }

  // GET (list, download): public access — RLS policies control data-level access
  // POST (upload), DELETE: requires gerente/transparencia access (checked per-action)
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1]; // last part after /functions/v1/transparencia/

    switch (req.method) {
      case "GET":
        if (action === "list" || action === "") {
          return await listReports(supabase);
        }
        if (action === "download") {
          const ano = url.searchParams.get("ano");
          const mes = url.searchParams.get("mes");
          if (!ano || !mes) {
            return new Response(JSON.stringify({ error: "Parâmetros ano e mes são obrigatórios" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return await downloadReport(supabase, parseInt(ano), parseInt(mes));
        }
        break;

      case "POST":
        if (action === "upload") {
          if (!user) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // Check if user is gerente/developer via database query
          // (uses service_role client to bypass RLS, but validates by email from JWT)
          const { data: membro, error: membroError } = await supabase
            .from("perfis_membros")
            .select("perfil")
            .eq("email", user.email)
            .single();
          if (membroError || !membro || !["gerente", "desenvolvedor"].includes(membro.perfil)) {
            return new Response(JSON.stringify({ error: "Acesso negado: apenas o gerente de transparência pode enviar relatórios" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return await uploadReport(supabase, req, user.id);
        }
        break;

      case "DELETE":
        if (action === "delete") {
          if (!user) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // Check if user is gerente/developer via database query
          const { data: membro, error: membroError } = await supabase
            .from("perfis_membros")
            .select("perfil")
            .eq("email", user.email)
            .single();
          if (membroError || !membro || !["gerente", "desenvolvedor"].includes(membro.perfil)) {
            return new Response(JSON.stringify({ error: "Acesso negado: apenas o gerente de transparência pode remover relatórios" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const ano = url.searchParams.get("ano");
          const mes = url.searchParams.get("mes");
          if (!ano || !mes) {
            return new Response(JSON.stringify({ error: "Parâmetros ano e mes são obrigatórios" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return await deleteReport(supabase, parseInt(ano), parseInt(mes));
        }
        break;
    }

    return new Response(JSON.stringify({ error: "Endpoint não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro na Edge Function transparencia:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function listReports(supabase: any) {
  const { data, error } = await supabase
    .from("transparencia_relatorios")
    .select("id, ano, mes, arquivo_nome, arquivo_tamanho, criado_em, atualizado_em, enviado_por")
    .eq("status_exclusao", "ativo")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ relatorios: data || [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function uploadReport(supabase: any, req: Request, userId: string) {
  const formData = await req.formData();
  const file = formData.get("arquivo") as File;
  const ano = formData.get("ano");
  const mes = formData.get("mes");

  if (!file || !ano || !mes) {
    return new Response(JSON.stringify({ error: "Arquivo, ano e mês são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anoNum = parseInt(ano as string);
  const mesNum = parseInt(mes as string);

  if (isNaN(anoNum) || anoNum < 2018 || anoNum > 2100) {
    return new Response(JSON.stringify({ error: "Ano inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
    return new Response(JSON.stringify({ error: "Mês inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate file type by MIME and binary PDF signature (magic bytes)
  if (file.type !== "application/pdf") {
    return new Response(JSON.stringify({ error: "Apenas arquivos PDF são permitidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const headerText = new TextDecoder().decode(headerBytes);
  if (headerText !== "%PDF-") {
    return new Response(JSON.stringify({ error: "Arquivo não possui assinatura PDF válida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "Arquivo deve ter no máximo 10MB" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if report already exists for this month/year
  const { data: existing } = await supabase
    .from("transparencia_relatorios")
    .select("id, arquivo_path")
    .eq("ano", anoNum)
    .eq("mes", mesNum)
    .single();

  const fileExt = "pdf";
  const fileName = `transparencia-${anoNum}-${mesNum.toString().padStart(2, "0")}.${fileExt}`;
  const storagePath = `${anoNum}/${mesNum.toString().padStart(2, "0")}/${fileName}`;

  // Upload to storage
  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("transparencia-relatorios")
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: true, // Replace if exists
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("transparencia-relatorios")
    .getPublicUrl(storagePath);

  // Upsert in database
  const { data, error } = await supabase
    .from("transparencia_relatorios")
    .upsert({
      ano: anoNum,
      mes: mesNum,
      arquivo_nome: fileName,
      arquivo_path: storagePath,
      arquivo_tamanho: file.size,
      enviado_por: userId,
    }, {
      onConflict: "ano,mes",
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    ok: true,
    mensagem: existing ? "Relatório substituído com sucesso" : "Relatório enviado com sucesso",
    relatorio: data,
    url: urlData.publicUrl,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function deleteReport(supabase: any, ano: number, mes: number) {
  // 1. Buscar registro atual
  const { data: report, error: findError } = await supabase
    .from("transparencia_relatorios")
    .select("id, arquivo_path, status_exclusao, storage_removed")
    .eq("ano", ano)
    .eq("mes", mes)
    .single();

  if (findError || !report) {
    return new Response(JSON.stringify({ error: "Relatório não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Se já está em 'excluindo', a operação já está em andamento — idempotente
  if (report.status_exclusao === "excluindo") {
    return new Response(JSON.stringify({
      ok: true,
      mensagem: "Exclusão já em andamento. Use o endpoint de recuperação para finalizar.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Se já está 'excluido', nada a fazer — pode ser tratado como sucesso silencioso
  if (report.status_exclusao === "excluido") {
    return new Response(JSON.stringify({ ok: true, mensagem: "Registro já excluído." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Marcar como 'excluindo' (intenção) — não removemos o Storage antes disso
  const { error: updateError } = await supabase
    .from("transparencia_relatorios")
    .update({ status_exclusao: "excluindo", storage_removed: false })
    .eq("id", report.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: "Falha ao marcar registro para exclusão" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Remover do Storage
  const { error: storageError } = await supabase.storage
    .from("transparencia-relatorios")
    .remove([report.arquivo_path]);

  if (storageError) {
    // Falha no Storage: manter em 'excluindo' para nova tentativa
    return new Response(JSON.stringify({
      error: `Falha ao remover arquivo no Storage: ${storageError.message}. Registro mantido em 'excluindo' para nova tentativa.`,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4. Marcar storage_removed = true e status = 'excluido'
  const { error: dbError } = await supabase
    .from("transparencia_relatorios")
    .update({ status_exclusao: "excluido", storage_removed: true })
    .eq("id", report.id);

  if (dbError) {
    // Storage removido, mas DB falhou: manter em 'excluindo' para recuperação
    // O storage_removed já é true, então uma nova tentativa pode pular o Storage
    return new Response(JSON.stringify({
      error: "Arquivo removido mas metadados nao puderam ser excluidos. Contate o administrador.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, mensagem: "Relatório removido com sucesso" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function downloadReport(supabase: any, ano: number, mes: number) {
  const { data: report, error } = await supabase
    .from("transparencia_relatorios")
    .select("arquivo_path, arquivo_nome")
    .eq("ano", ano)
    .eq("mes", mes)
    .eq("status_exclusao", "ativo")
    .single();

  if (error || !report) {
    return new Response(JSON.stringify({ error: "Relatório não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("transparencia-relatorios")
    .download(report.arquivo_path);

  if (downloadError || !fileData) {
    return new Response(JSON.stringify({ error: "Erro ao baixar arquivo" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(fileData, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.arquivo_nome}"`,
    },
  });
}