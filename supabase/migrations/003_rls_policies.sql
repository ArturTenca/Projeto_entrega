-- Gemma Entregas — 003: Row Level Security (RLS)
-- Depende de: 002_schema.sql
--
-- Regra do app: todos os usuários autenticados compartilham os mesmos dados.
-- anon → sem acesso | authenticated → CRUD completo nas tabelas de negócio

-- ---------------------------------------------------------------------------
-- Habilitar RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- produtos
-- ---------------------------------------------------------------------------

CREATE POLICY "produtos_select_authenticated"
  ON public.produtos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "produtos_insert_authenticated"
  ON public.produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "produtos_update_authenticated"
  ON public.produtos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "produtos_delete_authenticated"
  ON public.produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- condominios
-- ---------------------------------------------------------------------------

CREATE POLICY "condominios_select_authenticated"
  ON public.condominios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "condominios_insert_authenticated"
  ON public.condominios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "condominios_update_authenticated"
  ON public.condominios
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "condominios_delete_authenticated"
  ON public.condominios
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------

CREATE POLICY "clientes_select_authenticated"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clientes_insert_authenticated"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "clientes_update_authenticated"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clientes_delete_authenticated"
  ON public.clientes
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- pedidos
-- ---------------------------------------------------------------------------

CREATE POLICY "pedidos_select_authenticated"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pedidos_insert_authenticated"
  ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "pedidos_update_authenticated"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "pedidos_delete_authenticated"
  ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- entregas
-- ---------------------------------------------------------------------------

CREATE POLICY "entregas_select_authenticated"
  ON public.entregas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "entregas_insert_authenticated"
  ON public.entregas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "entregas_update_authenticated"
  ON public.entregas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "entregas_delete_authenticated"
  ON public.entregas
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- profiles
-- Leitura compartilhada; cada usuário só altera o próprio perfil
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Inserção apenas via trigger handle_new_user (SECURITY DEFINER)
-- Nenhuma policy de INSERT/DELETE para authenticated
