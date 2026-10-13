-- ============================================================
-- ADOTA PATOS — Migração: tabela de outras doações
-- ============================================================

CREATE TABLE doacoes_outros (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            TEXT NOT NULL,
    telefone        TEXT NOT NULL,
    email           TEXT NOT NULL,
    cidade          TEXT NOT NULL,
    outro_descricao TEXT NOT NULL,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    termo_versao    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE doacoes_outros IS 'Registro de ofertas de doações não alimentares recebidas pelo site.';

-- Índices
CREATE INDEX idx_doacoes_outros_cidade ON doacoes_outros(cidade);
CREATE INDEX idx_doacoes_outros_created ON doacoes_outros(created_at DESC);

-- ============================================================
-- SEGURANÇA (RLS)
-- ============================================================

ALTER TABLE doacoes_outros ENABLE ROW LEVEL SECURITY;

-- Visitante anônimo não pode ler (privacidade do doador)
-- Nenhuma política de SELECT para anon => acesso negado.

-- Usuários logados (equipe da ONG) podem ler todas as doações
CREATE POLICY "ong_le_doacoes_outros"
ON doacoes_outros FOR SELECT
TO authenticated
USING (eh_membro_ong());

-- Nenhuma política de INSERT/UPDATE/DELETE para anon ou authenticated;
-- somente a Edge Function (service_role) pode gravar, pois ignora RLS.