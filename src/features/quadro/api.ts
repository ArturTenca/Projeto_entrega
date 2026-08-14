import { supabase } from '@/lib/supabase'
import type { QuadroCard, QuadroColuna } from '@/types/database'

const DEFAULT_COLUMNS = ['A fazer', 'Em andamento', 'Concluído']

function schemaError(error: { message?: string; code?: string } | null) {
  if (
    error?.code === '42P01' ||
    error?.message?.includes('does not exist') ||
    error?.message?.includes('schema cache')
  ) {
    return 'Execute o SQL supabase/migrations/005_quadro.sql no Supabase para criar o quadro.'
  }

  return null
}

export async function fetchQuadro(): Promise<{
  colunas: QuadroColuna[]
  cards: QuadroCard[]
  error: string | null
}> {
  const colunasResult = await supabase
    .from('quadro_colunas')
    .select('*')
    .order('posicao', { ascending: true })

  if (colunasResult.error) {
    console.error('Erro ao carregar listas do quadro')
    return {
      colunas: [],
      cards: [],
      error:
        schemaError(colunasResult.error) ??
        'Não foi possível carregar o quadro.',
    }
  }

  let colunas = (colunasResult.data ?? []) as QuadroColuna[]

  if (colunas.length === 0) {
    const seeded = await seedDefaultColumns()
    if (seeded.error) {
      return { colunas: [], cards: [], error: seeded.error }
    }
    colunas = seeded.colunas
  }

  const cardsResult = await supabase
    .from('quadro_cards')
    .select('*')
    .order('posicao', { ascending: true })

  if (cardsResult.error) {
    console.error('Erro ao carregar cards do quadro')
    return {
      colunas,
      cards: [],
      error:
        schemaError(cardsResult.error) ?? 'Não foi possível carregar os cards.',
    }
  }

  return {
    colunas,
    cards: (cardsResult.data ?? []) as QuadroCard[],
    error: null,
  }
}

async function seedDefaultColumns(): Promise<{
  colunas: QuadroColuna[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('quadro_colunas')
    .insert(DEFAULT_COLUMNS.map((nome, posicao) => ({ nome, posicao })))
    .select('*')
    .order('posicao', { ascending: true })

  if (error) {
    return {
      colunas: [],
      error: schemaError(error) ?? 'Não foi possível criar as listas iniciais.',
    }
  }

  return { colunas: (data ?? []) as QuadroColuna[], error: null }
}

export async function createColuna(nome: string, posicao: number) {
  const { data, error } = await supabase
    .from('quadro_colunas')
    .insert({ nome, posicao })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar lista')
    return { data: null, error: 'Não foi possível criar a lista.' }
  }

  return { data: data as QuadroColuna, error: null }
}

export async function renameColuna(id: string, nome: string) {
  const { error } = await supabase
    .from('quadro_colunas')
    .update({ nome })
    .eq('id', id)

  if (error) {
    console.error('Erro ao renomear lista')
    return { error: 'Não foi possível renomear a lista.' }
  }

  return { error: null }
}

export async function deleteColuna(id: string) {
  const { error } = await supabase.from('quadro_colunas').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir lista')
    return { error: 'Não foi possível excluir a lista.' }
  }

  return { error: null }
}

export async function createCard(payload: {
  coluna_id: string
  titulo: string
  descricao: string | null
  data_entrega: string | null
  posicao: number
}) {
  const { data, error } = await supabase
    .from('quadro_cards')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar card')
    return { data: null, error: 'Não foi possível criar o card.' }
  }

  return { data: data as QuadroCard, error: null }
}

export async function updateCard(
  id: string,
  payload: {
    coluna_id?: string
    titulo?: string
    descricao?: string | null
    data_entrega?: string | null
    posicao?: number
  },
) {
  const { error } = await supabase
    .from('quadro_cards')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar card')
    return { error: 'Não foi possível salvar o card.' }
  }

  return { error: null }
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('quadro_cards').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir card')
    return { error: 'Não foi possível excluir o card.' }
  }

  return { error: null }
}
