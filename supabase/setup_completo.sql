-- =============================================================================
-- GEMMA ENTREGAS — Setup completo do banco (Supabase)
-- =============================================================================
--
-- Use em um projeto Supabase NOVO e VAZIO.
-- Cole este arquivo inteiro no SQL Editor e execute (Run).
--
-- Depois:
--   1. Authentication → Users → crie os usuários (André, Ana, etc.)
--   2. Authentication → Providers → Email → desabilite "Sign up"
--   3. Settings → API → copie URL e anon key para o .env
--   4. Deploy da Edge Function: npx supabase functions deploy login-rate-limit
--
-- Ordem interna: 001 → 002 → 003 → 004 → 005 → 006
-- =============================================================================

-- ########## 001_extensions_and_enums.sql ##########

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.dia_semana AS ENUM (
  'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
);

CREATE TYPE public.pedido_status AS ENUM (
  'ativo', 'pausado', 'cancelado'
);

CREATE TYPE public.entrega_status AS ENUM (
  'pendente', 'separado', 'em_rota', 'entregue'
);

CREATE TYPE public.user_role AS ENUM (
  'organizador', 'entregador'
);

CREATE TYPE public.theme_mode AS ENUM (
  'light', 'dark'
);

-- ########## 002_schema.sql ##########

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, theme)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    'entregador',
    'light'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT produtos_nome_length CHECK (char_length(nome) BETWEEN 1 AND 120)
);

CREATE TABLE public.condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  endereco text,
  latitude double precision,
  longitude double precision,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT condominios_nome_length CHECK (char_length(nome) BETWEEN 1 AND 120),
  CONSTRAINT condominios_endereco_length CHECK (endereco IS NULL OR char_length(endereco) <= 255),
  CONSTRAINT condominios_observacoes_length CHECK (observacoes IS NULL OR char_length(observacoes) <= 500),
  CONSTRAINT condominios_coords_pair CHECK (
    (latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  ),
  CONSTRAINT condominios_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT condominios_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  endereco text,
  condominio_id uuid REFERENCES public.condominios (id) ON DELETE SET NULL,
  produto_favorito_id uuid REFERENCES public.produtos (id) ON DELETE SET NULL,
  quantidade_favorita integer,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clientes_nome_length CHECK (char_length(nome) BETWEEN 1 AND 120),
  CONSTRAINT clientes_telefone_length CHECK (telefone IS NULL OR char_length(telefone) <= 20),
  CONSTRAINT clientes_endereco_length CHECK (endereco IS NULL OR char_length(endereco) <= 255),
  CONSTRAINT clientes_observacoes_length CHECK (observacoes IS NULL OR char_length(observacoes) <= 500),
  CONSTRAINT clientes_quantidade_favorita_range CHECK (
    quantidade_favorita IS NULL OR (quantidade_favorita >= 1 AND quantidade_favorita <= 9999)
  )
);

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes (id) ON DELETE RESTRICT,
  produto_id uuid REFERENCES public.produtos (id) ON DELETE RESTRICT,
  quantidade integer NOT NULL,
  dia_semana public.dia_semana NOT NULL,
  status public.pedido_status NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pedidos_quantidade_range CHECK (quantidade >= 1 AND quantidade <= 9999),
  CONSTRAINT pedidos_observacoes_length CHECK (observacoes IS NULL OR char_length(observacoes) <= 500)
);

CREATE TABLE public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos (id) ON DELETE CASCADE,
  data_prevista date NOT NULL,
  quantidade integer NOT NULL,
  status public.entrega_status NOT NULL DEFAULT 'pendente',
  observacoes text,
  entregue_em timestamptz,
  entregue_por uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entregas_quantidade_range CHECK (quantidade >= 1 AND quantidade <= 9999),
  CONSTRAINT entregas_observacoes_length CHECK (observacoes IS NULL OR char_length(observacoes) <= 500),
  CONSTRAINT entregas_entregue_em_required CHECK (status <> 'entregue' OR entregue_em IS NOT NULL),
  CONSTRAINT entregas_clear_delivery_when_not_entregue CHECK (
    status = 'entregue' OR (entregue_em IS NULL AND entregue_por IS NULL)
  ),
  CONSTRAINT entregas_pedido_data_unique UNIQUE (pedido_id, data_prevista)
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  role public.user_role NOT NULL DEFAULT 'entregador',
  theme public.theme_mode NOT NULL DEFAULT 'light',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 120)
);

CREATE INDEX idx_clientes_condominio_id ON public.clientes (condominio_id);
CREATE INDEX idx_clientes_nome ON public.clientes (nome);
CREATE INDEX idx_condominios_nome ON public.condominios (nome);
CREATE INDEX idx_pedidos_cliente_id ON public.pedidos (cliente_id);
CREATE INDEX idx_pedidos_status ON public.pedidos (status);
CREATE INDEX idx_pedidos_dia_semana ON public.pedidos (dia_semana);
CREATE INDEX idx_entregas_data_prevista ON public.entregas (data_prevista);
CREATE INDEX idx_entregas_pedido_id ON public.entregas (pedido_id);
CREATE INDEX idx_entregas_status ON public.entregas (status);

CREATE TRIGGER set_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_condominios_updated_at BEFORE UPDATE ON public.condominios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_entregas_updated_at BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, display_name, role, theme)
SELECT id, split_part(email, '@', 1), 'entregador', 'light'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ########## 003_rls_policies.sql ##########

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_select_authenticated" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "produtos_insert_authenticated" ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "produtos_update_authenticated" ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "produtos_delete_authenticated" ON public.produtos FOR DELETE TO authenticated USING (true);

CREATE POLICY "condominios_select_authenticated" ON public.condominios FOR SELECT TO authenticated USING (true);
CREATE POLICY "condominios_insert_authenticated" ON public.condominios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "condominios_update_authenticated" ON public.condominios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "condominios_delete_authenticated" ON public.condominios FOR DELETE TO authenticated USING (true);

CREATE POLICY "clientes_select_authenticated" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert_authenticated" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update_authenticated" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_delete_authenticated" ON public.clientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "pedidos_select_authenticated" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pedidos_insert_authenticated" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pedidos_update_authenticated" ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pedidos_delete_authenticated" ON public.pedidos FOR DELETE TO authenticated USING (true);

CREATE POLICY "entregas_select_authenticated" ON public.entregas FOR SELECT TO authenticated USING (true);
CREATE POLICY "entregas_insert_authenticated" ON public.entregas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "entregas_update_authenticated" ON public.entregas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "entregas_delete_authenticated" ON public.entregas FOR DELETE TO authenticated USING (true);

CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ########## 004_login_ip_blocks.sql ##########

CREATE TABLE public.login_ip_blocks (
  ip_address text PRIMARY KEY,
  blocked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT login_ip_blocks_ip_length CHECK (char_length(ip_address) BETWEEN 7 AND 45)
);

CREATE INDEX idx_login_ip_blocks_blocked_until ON public.login_ip_blocks (blocked_until);

CREATE TRIGGER set_login_ip_blocks_updated_at
  BEFORE UPDATE ON public.login_ip_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.login_ip_blocks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cleanup_expired_login_ip_blocks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.login_ip_blocks WHERE blocked_until < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_login_ip_blocks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_login_ip_blocks() TO service_role;

-- ########## 005_quadro.sql ##########

CREATE TABLE public.quadro_colunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quadro_colunas_nome_length CHECK (char_length(nome) BETWEEN 1 AND 80)
);

CREATE TABLE public.quadro_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coluna_id uuid NOT NULL REFERENCES public.quadro_colunas (id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data_entrega date,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quadro_cards_titulo_length CHECK (char_length(titulo) BETWEEN 1 AND 120),
  CONSTRAINT quadro_cards_descricao_length CHECK (
    descricao IS NULL OR char_length(descricao) <= 500
  )
);

CREATE INDEX idx_quadro_colunas_posicao ON public.quadro_colunas (posicao);
CREATE INDEX idx_quadro_cards_coluna_id ON public.quadro_cards (coluna_id);
CREATE INDEX idx_quadro_cards_posicao ON public.quadro_cards (coluna_id, posicao);

CREATE TRIGGER set_quadro_colunas_updated_at
  BEFORE UPDATE ON public.quadro_colunas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_quadro_cards_updated_at
  BEFORE UPDATE ON public.quadro_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quadro_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quadro_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quadro_colunas_select_authenticated"
  ON public.quadro_colunas FOR SELECT TO authenticated USING (true);
CREATE POLICY "quadro_colunas_insert_authenticated"
  ON public.quadro_colunas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quadro_colunas_update_authenticated"
  ON public.quadro_colunas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quadro_colunas_delete_authenticated"
  ON public.quadro_colunas FOR DELETE TO authenticated USING (true);

CREATE POLICY "quadro_cards_select_authenticated"
  ON public.quadro_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "quadro_cards_insert_authenticated"
  ON public.quadro_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quadro_cards_update_authenticated"
  ON public.quadro_cards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quadro_cards_delete_authenticated"
  ON public.quadro_cards FOR DELETE TO authenticated USING (true);

INSERT INTO public.quadro_colunas (nome, posicao) VALUES
  ('A fazer', 0),
  ('Em andamento', 1),
  ('Concluído', 2);

-- =============================================================================
-- Fim do setup
-- =============================================================================

-- ########## 006_financeiro.sql ##########


ALTER TABLE public.produtos
  ADD COLUMN preco_custo numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN preco_venda numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.produtos
  ALTER COLUMN preco_custo DROP DEFAULT,
  ALTER COLUMN preco_venda DROP DEFAULT,
  ADD CONSTRAINT produtos_preco_custo_range CHECK (
    preco_custo >= 0 AND preco_custo <= 99999999
  ),
  ADD CONSTRAINT produtos_preco_venda_range CHECK (
    preco_venda >= 0 AND preco_venda <= 99999999
  );

-- Valores unitários congelados no momento da entrega, para que mudar o preço
-- de um produto não altere o histórico financeiro.
ALTER TABLE public.entregas
  ADD COLUMN valor_unitario_custo numeric(10, 2),
  ADD COLUMN valor_unitario_venda numeric(10, 2);

CREATE OR REPLACE FUNCTION public.set_entrega_valores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'entregue' THEN
    NEW.valor_unitario_custo = NULL;
    NEW.valor_unitario_venda = NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'entregue' THEN
    RETURN NEW;
  END IF;

  SELECT pr.preco_custo, pr.preco_venda
    INTO NEW.valor_unitario_custo, NEW.valor_unitario_venda
  FROM public.pedidos p
  JOIN public.produtos pr ON pr.id = p.produto_id
  WHERE p.id = NEW.pedido_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_entregas_valores
  BEFORE INSERT OR UPDATE OF status ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_entrega_valores();

CREATE INDEX idx_entregas_status_data ON public.entregas (status, data_prevista);
