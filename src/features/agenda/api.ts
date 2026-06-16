import { supabase } from '@/lib/supabase'
import { toDateISO } from '@/lib/dates'
import type { DiaSemana, PedidoComCliente } from '@/types/database'
import { DIA_SEMANA_LABEL } from '@/types/database'

const DIA_TO_JS: Record<DiaSemana, number> = {
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
}

export function getWeekMonday(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function dateForDiaSemana(weekMonday: Date, dia: DiaSemana): string {
  const date = new Date(weekMonday)
  date.setDate(date.getDate() + DIA_TO_JS[dia] - 1)
  return toDateISO(date)
}

export async function fetchPedidosAtivos(): Promise<{
  data: PedidoComCliente[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(
      `*, produtos ( id, nome ), clientes ( id, nome, telefone, endereco, condominio_id, condominios ( id, nome ) )`,
    )
    .eq('status', 'ativo')

  if (error) {
    console.error('Erro ao buscar pedidos ativos')
    return { data: [], error: 'Não foi possível carregar a agenda.' }
  }

  return { data: (data ?? []) as PedidoComCliente[], error: null }
}

export function groupPedidosByDia(pedidos: PedidoComCliente[]) {
  const dias = Object.keys(DIA_SEMANA_LABEL) as DiaSemana[]

  return dias.map((dia) => ({
    dia,
    label: DIA_SEMANA_LABEL[dia],
    pedidos: pedidos.filter((pedido) => pedido.dia_semana === dia),
    totalOvos: pedidos
      .filter((pedido) => pedido.dia_semana === dia)
      .reduce((sum, pedido) => sum + pedido.quantidade, 0),
  }))
}

export async function generateEntregasForWeek(
  weekMonday: Date,
): Promise<{ created: number; error: string | null }> {
  const { data: pedidos, error: fetchError } = await fetchPedidosAtivos()

  if (fetchError) {
    return { created: 0, error: fetchError }
  }

  const inserts: Array<{
    pedido_id: string
    data_prevista: string
    quantidade: number
    status: 'pendente'
  }> = []

  for (const pedido of pedidos) {
    const dataPrevista = dateForDiaSemana(weekMonday, pedido.dia_semana)
    inserts.push({
      pedido_id: pedido.id,
      data_prevista: dataPrevista,
      quantidade: pedido.quantidade,
      status: 'pendente',
    })
  }

  if (inserts.length === 0) {
    return { created: 0, error: null }
  }

  const { data, error } = await supabase
    .from('entregas')
    .upsert(inserts, {
      onConflict: 'pedido_id,data_prevista',
      ignoreDuplicates: true,
    })
    .select('id')

  if (error) {
    console.error('Erro ao gerar entregas')
    return { created: 0, error: 'Não foi possível gerar as entregas.' }
  }

  return { created: data?.length ?? 0, error: null }
}
