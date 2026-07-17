-- Gemma Entregas — 004: bloqueio de IP no login (Edge Function login-rate-limit)
-- Depende de: 001_extensions_and_enums.sql
--
-- Acesso apenas via service_role (Edge Function). Usuários anon/authenticated
-- não têm policies — RLS bloqueia tudo para eles.

CREATE TABLE public.login_ip_blocks (
  ip_address text PRIMARY KEY,
  blocked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT login_ip_blocks_ip_length CHECK (
    char_length(ip_address) BETWEEN 7 AND 45
  )
);

CREATE INDEX idx_login_ip_blocks_blocked_until
  ON public.login_ip_blocks (blocked_until);

CREATE TRIGGER set_login_ip_blocks_updated_at
  BEFORE UPDATE ON public.login_ip_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.login_ip_blocks ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy = anon e authenticated não acessam.
-- service_role (Edge Function) ignora RLS e gerencia os bloqueios.

-- Limpeza opcional de bloqueios expirados (pode agendar no Supabase)
CREATE OR REPLACE FUNCTION public.cleanup_expired_login_ip_blocks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.login_ip_blocks
  WHERE blocked_until < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_login_ip_blocks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_login_ip_blocks() TO service_role;
