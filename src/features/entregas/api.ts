import { supabase } from '@/lib/supabase'
import type { EntregaComDetalhes } from '@/types/database'

const ENTREGA_SELECT = `
  *,
  pedidos (
    *,
    produtos ( id, nome ),
    clientes (
      id,
      nome,
      telefone,
      endereco,
      condominio_id,
      condominios (
        id,
        nome,
        endereco,
        latitude,
        longitude
      )
    )
  )
`

export async function fetchEntregasByDate(
  date: string,
): Promise<{ data: EntregaComDetalhes[]; error: string | null }> {
  const { data, error } = await supabase
    .from('entregas')
    .select(ENTREGA_SELECT)
    .eq('data_prevista', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar entregas do dia')
    return { data: [], error: 'Não foi possível carregar as entregas.' }
  }

  return { data: (data ?? []) as EntregaComDetalhes[], error: null }
}

export async function updateEntregaStatus(
  entregaId: string,
  status: EntregaComDetalhes['status'],
  userId: string | undefined,
): Promise<{ error: string | null }> {
  const payload = {
    status,
    entregue_em: status === 'entregue' ? new Date().toISOString() : null,
    entregue_por: status === 'entregue' ? userId ?? null : null,
  }

  const { error } = await supabase.from('entregas').update(payload).eq('id', entregaId)

  if (error) {
    console.error('Erro ao atualizar status da entrega')
    return { error: 'Não foi possível atualizar a entrega.' }
  }

  return { error: null }
}
