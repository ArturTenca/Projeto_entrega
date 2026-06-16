import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types/database'

export async function fetchProdutos(): Promise<{
  data: Produto[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao listar produtos')
    return { data: [], error: 'Não foi possível carregar os produtos.' }
  }

  return { data: (data ?? []) as Produto[], error: null }
}

export async function createProduto(payload: {
  nome: string
  ativo: boolean
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('produtos').insert(payload)

  if (error) {
    console.error('Erro ao criar produto')
    return { error: 'Não foi possível criar o produto.' }
  }

  return { error: null }
}

export async function updateProduto(
  id: string,
  payload: { nome?: string; ativo?: boolean },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('produtos').update(payload).eq('id', id)

  if (error) {
    console.error('Erro ao atualizar produto')
    return { error: 'Não foi possível atualizar o produto.' }
  }

  return { error: null }
}

export async function deleteProduto(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('produtos').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir produto')
    return {
      error: 'Não foi possível excluir o produto. Verifique pedidos vinculados.',
    }
  }

  return { error: null }
}
