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

  // Get user from auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Sessão inválida" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if user is the transparency manager
  const { data: isManager, error: managerError } = await supabase.rpc("eh_gerente_transparencia");
  if (managerError || !isManager) {
    return new Response(JSON.stringify({ error: "Acesso negado: apenas o gerente de transparência pode realizar esta operação" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
          return await uploadReport(supabase, req, user.id);
        }
        break;

      case "DELETE":
        if (action === "delete") {
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

  // Validate file type
  if (file.type !== "application/pdf") {
    return new Response(JSON.stringify({ error: "Apenas arquivos PDF são permitidos" }), {
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
  // Get report info first
  const { data: report, error: findError } = await supabase
    .from("transparencia_relatorios")
    .select("id, arquivo_path")
    .eq("ano", ano)
    .eq("mes", mes)
    .single();

  if (findError || !report) {
    return new Response(JSON.stringify({ error: "Relatório não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("transparencia-relatorios")
    .remove([report.arquivo_path]);

  if (storageError) {
    console.warn("Erro ao deletar do storage:", storageError);
    // Continue to delete from DB even if storage fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("transparencia_relatorios")
    .delete()
    .eq("id", report.id);

  if (dbError) throw dbError;

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