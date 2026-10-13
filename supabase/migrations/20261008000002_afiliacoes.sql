-- ============================================================
-- ADOTA PATOS — Migração: tabela de afiliações
-- ============================================================

CREATE TABLE afiliacoes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            TEXT NOT NULL,
    nome_mae        TEXT NOT NULL,
    data_nasc       DATE NOT NULL,
    sexo            TEXT NOT NULL CHECK (sexo IN ('M', 'F', 'Outro')),
    estado_civil    TEXT NOT NULL CHECK (estado_civil IN ('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável')),
    rg              TEXT NOT NULL,
    orgao_expedidor TEXT NOT NULL,
    cpf             TEXT NOT NULL,
    endereco        TEXT NOT NULL,
    bairro          TEXT NOT NULL,
    cep             TEXT NOT NULL,
    cidade          TEXT NOT NULL,
    uf              TEXT NOT NULL CHECK (uf ~ '^[A-Z]{2}$'),
    telefone        TEXT NOT NULL,
    email           TEXT NOT NULL,
    caes            INTEGER NOT NULL DEFAULT 0 CHECK (caes >= 0),
    gatos           INTEGER NOT NULL DEFAULT 0 CHECK (gatos >= 0),
    total_animais   INTEGER NOT NULL DEFAULT 0,
    declaracoes     JSONB NOT NULL DEFAULT '{}'::jsonb,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    termo_versao    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE afiliacoes IS 'Registro de inscrições de afiliação recebidas pelo site.';

-- Índices comuns
CREATE INDEX idx_afiliacoes_cpf ON afiliacoes(cpf);
CREATE INDEX idx_afiliacoes_email ON afiliacoes(email);
CREATE INDEX idx_afiliacoes_created ON afiliacoes(created_at DESC);

-- ============================================================
-- SEGURANÇA (RLS)
-- ============================================================

ALTER TABLE afiliacoes ENABLE ROW LEVEL SECURITY;

-- Visitante anônimo não pode ler (privacidade do associado)
-- Nenhuma política de SELECT para anon => acesso negado.

-- Usuários logados (equipe da ONG) podem ler todas as afiliações
CREATE POLICY "ong_le_afiliacoes"
ON afiliacoes FOR SELECT
TO authenticated
USING (true)
WITH CHECK (true);

-- Nenhuma política de INSERT/UPDATE/DELETE para anon ou authenticated;
-- somente a Edge Function (service_role) pode gravar, pois ignora RLS.