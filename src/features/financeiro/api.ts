import { supabase } from '@/lib/supabase'

export interface EntregaFinanceira {
  id: string
  data_prevista: string
  quantidade: number
  valor_unitario_custo: number | null
  valor_unitario_venda: number | null
  pedidos: {
    cliente_id: string
    produto_id: string | null
    produtos: {
      id: string
      nome: string
      preco_custo: number
      preco_venda: number
    } | null
    clientes: { id: string; nome: string } | null
  } | null
}

const FINANCEIRO_SELECT = `
  id,
  data_prevista,
  quantidade,
  valor_unitario_custo,
  valor_unitario_venda,
  pedidos (
    cliente_id,
    produto_id,
    produtos ( id, nome, preco_custo, preco_venda ),
    clientes ( id, nome )
  )
`

/** Apenas entregas concluídas contam no financeiro. */
export async function fetchEntregasFinanceiro(
  startDate: string,
  endDate: string,
): Promise<{ data: EntregaFinanceira[]; error: string | null }> {
  const { data, error } = await supabase
    .from('entregas')
    .select(FINANCEIRO_SELECT)
    .eq('status', 'entregue')
    .gte('data_prevista', startDate)
    .lte('data_prevista', endDate)
    .order('data_prevista', { ascending: true })

  if (error) {
    console.error('Erro ao buscar dados financeiros')
    return { data: [], error: 'Não foi possível carregar o financeiro.' }
  }

  return { data: (data ?? []) as unknown as EntregaFinanceira[], error: null }
}
