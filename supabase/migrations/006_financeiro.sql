-- Gemma Entregas — 006: valores de custo/venda dos produtos e financeiro
-- Execute no SQL Editor se o projeto já estiver criado.
-- Produtos existentes recebem 0 — edite cada um no app para informar os valores.

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
