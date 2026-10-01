-- ============================================================
-- 🐾 ADOTA PATOS — Script de criação do banco de dados
-- ------------------------------------------------------------
-- Como usar: cole este script inteiro no SQL Editor do projeto
-- no Supabase (https://supabase.com/dashboard) e execute UMA vez.
--
-- O que ele faz, em ordem:
--   1. Cria a tabela "animais" (a ficha de cada animal)
--   2. Cria a tabela "adocoes" (a ficha de cada candidato)
--   3. Liga as duas tabelas e protege contra erros de digitação
--   4. Define QUEM pode ler/escrever cada tabela (segurança RLS)
--   5. Cria a pasta "fotos-animais" no Storage
-- ============================================================


-- ============================================================
-- 1. TABELA ANIMAIS
-- A vitrine do site lê daqui. O painel da ONG escreve aqui.
-- ============================================================

CREATE TABLE animais (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        TEXT NOT NULL,
    especie     TEXT NOT NULL DEFAULT 'Cão'
                CHECK (especie IN ('Cão', 'Gato', 'Outro')),
    raca        TEXT,
    idade       TEXT NOT NULL,
    sexo        TEXT NOT NULL CHECK (sexo IN ('Macho', 'Fêmea')),
    porte       TEXT NOT NULL CHECK (porte IN ('Pequeno', 'Médio', 'Grande')),
    descricao   TEXT NOT NULL,
    foto_url    TEXT,
    status      TEXT NOT NULL DEFAULT 'Disponível'
                CHECK (status IN ('Disponível', 'Adotado')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE animais IS 'Ficha de cada animal da ONG. O site mostra apenas os com status Disponível.';


-- ============================================================
-- 2. TABELA ADOCOES
-- Cada linha é uma pessoa que se candidatou pelo formulário.
-- Chega aqui via Edge Function (receber-adocao) ou pelo painel.
-- ============================================================

CREATE TABLE adocoes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id        UUID REFERENCES animais(id) ON DELETE SET NULL,
    nome             TEXT NOT NULL,
    telefone         TEXT NOT NULL,
    email            TEXT NOT NULL,
    cidade           TEXT NOT NULL,
    experiencia      TEXT NOT NULL,
    motivo           TEXT NOT NULL,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    termo_versao     TEXT,
    status           TEXT NOT NULL DEFAULT 'Pendente'
                     CHECK (status IN ('Pendente', 'Em análise', 'Aprovada', 'Recusada')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE adocoes IS 'Solicitações de adoção recebidas pelo site. animal_id pode ficar vazio se o animal for removido do banco (histórico preservado).';

-- Índice: a consulta mais comum é "quais solicitações o Thor recebeu?".
-- Sem índice, o banco folhearia a tabela inteira pra responder.

CREATE INDEX idx_adocoes_animal_id ON adocoes(animal_id);

-- Índice: a ONG sempre quer ver as pendências primeiro, das mais recentes.

CREATE INDEX idx_adocoes_status_created ON adocoes(status, created_at DESC);


-- ============================================================
-- 3. SEGURANÇA (RLS — Row Level Security)
-- Regra geral: começa TUDO trancado; abre só o necessário.
--
-- Quem acessa o quê:
--   • Visitante anônimo → só LÊ animais disponíveis (site público)
--   • ONG logada        → controla animais e lê/atualiza solicitações
--   • Edge Function     → grava novas solicitações usando a chave
--                         privada service_role (que ignora RLS,
--                         por isso NUNCA vai para o site)
-- ============================================================

ALTER TABLE animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE adocoes ENABLE ROW LEVEL SECURITY;

-- 3.1 Visitante vê somente os animais Disponíveis.
--     (Adotados continuam existindo, mas não aparecem no catálogo.)

CREATE POLICY "visitante_ve_animais_disponiveis"
ON animais FOR SELECT
TO anon
USING (status = 'Disponível');

-- 3.2 Usuários logados (equipe da ONG) têm controle total dos animais:
--     ler tudo (inclusive Adotados), cadastrar, editar e excluir.

CREATE POLICY "ong_gerencia_animais"
ON animais FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3.3 A ONG precisa LER todas as solicitações para avaliá-las.

CREATE POLICY "ong_le_adocoes"
ON adocoes FOR SELECT
TO authenticated
USING (true);

-- 3.4 A ONG atualiza o status da solicitação
--     (de Pendente para Aprovada ou Rejeitada).

CREATE POLICY "ong_atualiza_adocoes"
ON adocoes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3.5 Gravação pública direta nas solicitações? NÃO existe política.
--     O anon não pode inserir nada aqui. Quem insere é a Edge Function,
--     com a chave service_role — o visitante nunca tem contato.


-- ============================================================
-- 4. STORAGE DAS FOTOS
-- Bucket = pasta onde ficam as fotos dos animais.
-- Ler foto: qualquer pessoa (o site precisa mostrar).
-- Enviar/atualizar foto: só a ONG logada.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-animais', 'fotos-animais', true);

CREATE POLICY "visitante_ve_fotos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'fotos-animais');

CREATE POLICY "ong_gerencia_fotos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'fotos-animais')
WITH CHECK (bucket_id = 'fotos-animais');


-- ============================================================
-- FIM. Para conferir se deu certo, rode no SQL Editor:
--   SELECT * FROM animais;
--   SELECT * FROM adocoes;
-- As duas devem retornar vazio, sem erro.
-- ============================================================
