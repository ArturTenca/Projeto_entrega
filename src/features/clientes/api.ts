import { supabase } from '@/lib/supabase'
import type { ClienteComCondominio } from '@/types/database'

const CLIENTE_SELECT = `
  *,
  condominios ( id, nome ),
  produto_favorito:produtos!produto_favorito_id ( id, nome )
`

export async function fetchClientes(): Promise<{
  data: ClienteComCondominio[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('clientes')
    .select(CLIENTE_SELECT)
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao listar clientes')
    return { data: [], error: 'Não foi possível carregar os clientes.' }
  }

  return { data: (data ?? []) as ClienteComCondominio[], error: null }
}

export async function createCliente(payload: {
  nome: string
  telefone: string | null
  endereco: string | null
  condominio_id: string | null
  produto_favorito_id: string | null
  quantidade_favorita: number | null
  observacoes: string | null
  ativo: boolean
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clientes').insert(payload)

  if (error) {
    console.error('Erro ao criar cliente')
    return { error: 'Não foi possível criar o cliente.' }
  }

  return { error: null }
}

export async function updateCliente(
  id: string,
  payload: {
    nome?: string
    telefone?: string | null
    endereco?: string | null
    condominio_id?: string | null
    produto_favorito_id?: string | null
    quantidade_favorita?: number | null
    observacoes?: string | null
    ativo?: boolean
  },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clientes').update(payload).eq('id', id)

  if (error) {
    console.error('Erro ao atualizar cliente')
    return { error: 'Não foi possível atualizar o cliente.' }
  }

  return { error: null }
}

export async function deleteCliente(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir cliente')
    return { error: 'Não foi possível excluir o cliente. Verifique pedidos vinculados.' }
  }

  return { error: null }
}
