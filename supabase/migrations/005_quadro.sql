-- Gemma Entregas — 005: quadro de tarefas (listas e cards)
-- Execute no SQL Editor se o projeto já estiver criado.

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
