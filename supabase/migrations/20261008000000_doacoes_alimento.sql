-- ============================================================
-- ADOTA PATOS — Migração: tabela de doações de alimentos
-- ============================================================

CREATE TABLE doacoes_alimentos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            TEXT NOT NULL,
    telefone        TEXT NOT NULL,
    email           TEXT NOT NULL,
    cidade          TEXT NOT NULL,
    alimento_tipo   TEXT NOT NULL CHECK (alimento_tipo IN ('racao_cao', 'racao_gato', 'outro')),
    alimento_descricao TEXT, -- somente preenchido quando alimento_tipo = 'outro'
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    termo_versao    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE doacoes_alimentos IS 'Registro de doações de alimentos recebidas pelo site.';

-- Índices comuns
CREATE INDEX idx_doacoes_alimentos_cidade ON doacoes_alimentos(cidade);
CREATE INDEX idx_doacoes_alimentos_created ON doacoes_alimentos(created_at DESC);

-- ============================================================
-- SEGURANÇA (RLS)
-- ============================================================

ALTER TABLE doacoes_alimentos ENABLE ROW LEVEL SECURITY;

-- Visitante anônimo não pode ler (privacidade do doador)
-- Nenhuma política de SELECT para anon => acesso negado.

-- Usuários logados (equipe da ONG) podem ler todas as doações
CREATE POLICY "ong_le_doacoes_alimentos"
ON doacoes_alimentos FOR SELECT
TO authenticated
USING (true)
WITH CHECK (true);

-- Nenhuma política de INSERT/UPDATE/DELETE para anon ou authenticated;
-- somente a Edge Function (service_role) pode gravar, pois ignora RLS.