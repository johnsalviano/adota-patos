-- ============================================================
-- ADOTA PATOS — Migration 020: Status de exclusão para recuperação
-- ------------------------------------------------------------
ALTER TABLE transparencia_relatorios
    ADD COLUMN IF NOT EXISTS status_exclusao TEXT DEFAULT 'ativo'
    CHECK (status_exclusao IN ('ativo', 'excluindo', 'excluido'));

ALTER TABLE transparencia_relatorios
    ADD COLUMN IF NOT EXISTS storage_removed BOOLEAN DEFAULT FALSE;
