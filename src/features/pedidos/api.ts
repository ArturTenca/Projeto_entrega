import { supabase } from '@/lib/supabase'
import type { PedidoComCliente } from '@/types/database'

const PEDIDO_SELECT = `
  *,
  produtos ( id, nome ),
  clientes (
    id,
    nome,
    telefone,
    endereco,
    condominio_id,
    produto_favorito_id,
    quantidade_favorita,
    condominios ( id, nome, endereco, latitude, longitude ),
    produto_favorito:produtos!produto_favorito_id ( id, nome )
  )
`

export async function fetchPedidos(): Promise<{
  data: PedidoComCliente[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar pedidos')
    return { data: [], error: 'Não foi possível carregar os pedidos.' }
  }

  return { data: (data ?? []) as PedidoComCliente[], error: null }
}

export async function createPedido(payload: {
  cliente_id: string
  produto_id: string | null
  quantidade: number
  dia_semana: PedidoComCliente['dia_semana']
  status: PedidoComCliente['status']
  observacoes: string | null
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pedidos').insert(payload)

  if (error) {
    console.error('Erro ao criar pedido')
    return { error: 'Não foi possível criar o pedido.' }
  }

  return { error: null }
}

export async function updatePedido(
  id: string,
  payload: {
    cliente_id?: string
    produto_id?: string | null
    quantidade?: number
    dia_semana?: PedidoComCliente['dia_semana']
    status?: PedidoComCliente['status']
    observacoes?: string | null
  },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pedidos').update(payload).eq('id', id)

  if (error) {
    console.error('Erro ao atualizar pedido')
    return { error: 'Não foi possível atualizar o pedido.' }
  }

  return { error: null }
}

export async function deletePedido(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir pedido')
    return { error: 'Não foi possível excluir o pedido.' }
  }

  return { error: null }
}
