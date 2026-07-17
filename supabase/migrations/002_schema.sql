-- Gemma Entregas — 002: tabelas, constraints, índices e triggers
-- Depende de: 001_extensions_and_enums.sql

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

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
  CONSTRAINT condominios_endereco_length CHECK (
    endereco IS NULL OR char_length(endereco) <= 255
  ),
  CONSTRAINT condominios_observacoes_length CHECK (
    observacoes IS NULL OR char_length(observacoes) <= 500
  ),
  CONSTRAINT condominios_coords_pair CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  ),
  CONSTRAINT condominios_latitude_range CHECK (
    latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
  ),
  CONSTRAINT condominios_longitude_range CHECK (
    longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
  )
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
  CONSTRAINT clientes_telefone_length CHECK (
    telefone IS NULL OR char_length(telefone) <= 20
  ),
  CONSTRAINT clientes_endereco_length CHECK (
    endereco IS NULL OR char_length(endereco) <= 255
  ),
  CONSTRAINT clientes_observacoes_length CHECK (
    observacoes IS NULL OR char_length(observacoes) <= 500
  ),
  CONSTRAINT clientes_quantidade_favorita_range CHECK (
    quantidade_favorita IS NULL
    OR (quantidade_favorita >= 1 AND quantidade_favorita <= 9999)
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
  CONSTRAINT pedidos_quantidade_range CHECK (
    quantidade >= 1 AND quantidade <= 9999
  ),
  CONSTRAINT pedidos_observacoes_length CHECK (
    observacoes IS NULL OR char_length(observacoes) <= 500
  )
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
  CONSTRAINT entregas_quantidade_range CHECK (
    quantidade >= 1 AND quantidade <= 9999
  ),
  CONSTRAINT entregas_observacoes_length CHECK (
    observacoes IS NULL OR char_length(observacoes) <= 500
  ),
  CONSTRAINT entregas_entregue_em_required CHECK (
    status <> 'entregue' OR entregue_em IS NOT NULL
  ),
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
  CONSTRAINT profiles_display_name_length CHECK (
    display_name IS NULL OR char_length(display_name) <= 120
  )
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

CREATE INDEX idx_clientes_condominio_id ON public.clientes (condominio_id);
CREATE INDEX idx_clientes_nome ON public.clientes (nome);
CREATE INDEX idx_condominios_nome ON public.condominios (nome);
CREATE INDEX idx_pedidos_cliente_id ON public.pedidos (cliente_id);
CREATE INDEX idx_pedidos_status ON public.pedidos (status);
CREATE INDEX idx_pedidos_dia_semana ON public.pedidos (dia_semana);
CREATE INDEX idx_entregas_data_prevista ON public.entregas (data_prevista);
CREATE INDEX idx_entregas_pedido_id ON public.entregas (pedido_id);
CREATE INDEX idx_entregas_status ON public.entregas (status);

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER set_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_condominios_updated_at
  BEFORE UPDATE ON public.condominios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_entregas_updated_at
  BEFORE UPDATE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: criar profile ao cadastrar usuário no Auth
-- ---------------------------------------------------------------------------

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill: usuários já existentes no Auth antes desta migration
-- ---------------------------------------------------------------------------

INSERT INTO public.profiles (id, display_name, role, theme)
SELECT
  id,
  split_part(email, '@', 1),
  'entregador',
  'light'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
