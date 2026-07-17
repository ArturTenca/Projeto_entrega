-- Gemma Entregas — 001: extensões e tipos enumerados
-- Execute no SQL Editor do Supabase (projeto novo/vazio)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Dias da semana de entrega (segunda a sábado)
CREATE TYPE public.dia_semana AS ENUM (
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado'
);

CREATE TYPE public.pedido_status AS ENUM (
  'ativo',
  'pausado',
  'cancelado'
);

CREATE TYPE public.entrega_status AS ENUM (
  'pendente',
  'separado',
  'em_rota',
  'entregue'
);

CREATE TYPE public.user_role AS ENUM (
  'organizador',
  'entregador'
);

CREATE TYPE public.theme_mode AS ENUM (
  'light',
  'dark'
);
