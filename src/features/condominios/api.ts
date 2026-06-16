import { supabase } from '@/lib/supabase'
import type { Condominio } from '@/types/database'

export async function fetchCondominios(): Promise<{
  data: Condominio[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('condominios')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao listar condomínios')
    return { data: [], error: 'Não foi possível carregar os condomínios.' }
  }

  return { data: (data ?? []) as Condominio[], error: null }
}

export async function createCondominio(
  payload: Omit<Condominio, 'id' | 'created_at' | 'updated_at'>,
): Promise<{ data: Condominio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('condominios')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar condomínio')
    return { data: null, error: 'Não foi possível criar o condomínio.' }
  }

  return { data: data as Condominio, error: null }
}

export async function updateCondominio(
  id: string,
  payload: Partial<
    Omit<Condominio, 'id' | 'created_at' | 'updated_at'>
  >,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('condominios')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar condomínio')
    return { error: 'Não foi possível atualizar o condomínio.' }
  }

  return { error: null }
}

export async function deleteCondominio(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('condominios').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir condomínio')
    return { error: 'Não foi possível excluir o condomínio.' }
  }

  return { error: null }
}
