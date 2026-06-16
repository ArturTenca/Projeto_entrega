import type { EntregaComDetalhes, EntregaStatus } from '@/types/database'

export type CondominioEntregaGroup = {
  condominioId: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
  entregas: EntregaComDetalhes[]
  totalOvos: number
  clientesUnicos: number
  pendentes: number
  entregues: number
}

const SEM_CONDOMINIO_ID = '__sem_condominio__'

export function groupEntregasByCondominio(
  entregas: EntregaComDetalhes[],
): CondominioEntregaGroup[] {
  const groups = new Map<string, CondominioEntregaGroup>()

  for (const entrega of entregas) {
    const condominio = entrega.pedidos.clientes.condominios
    const condominioId = condominio?.id ?? SEM_CONDOMINIO_ID
    const nome = condominio?.nome ?? 'Sem condomínio'
    const endereco =
      condominio?.endereco ?? entrega.pedidos.clientes.endereco ?? null

    const existing = groups.get(condominioId)

    if (existing) {
      existing.entregas.push(entrega)
      existing.totalOvos += entrega.quantidade
      if (entrega.status !== 'entregue') existing.pendentes += 1
      if (entrega.status === 'entregue') existing.entregues += 1
      continue
    }

    groups.set(condominioId, {
      condominioId,
      nome,
      endereco,
      latitude: condominio?.latitude ?? null,
      longitude: condominio?.longitude ?? null,
      entregas: [entrega],
      totalOvos: entrega.quantidade,
      clientesUnicos: 0,
      pendentes: entrega.status !== 'entregue' ? 1 : 0,
      entregues: entrega.status === 'entregue' ? 1 : 0,
    })
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    clientesUnicos: new Set(
      group.entregas.map((entrega) => entrega.pedidos.cliente_id),
    ).size,
  }))
}

export function getDeliveryDayStats(entregas: EntregaComDetalhes[]) {
  const pendentes = entregas.filter((entrega) => entrega.status !== 'entregue')
  const entregues = entregas.filter((entrega) => entrega.status === 'entregue')
  const condominios = groupEntregasByCondominio(entregas)

  return {
    total: entregas.length,
    pendentes: pendentes.length,
    entregues: entregues.length,
    totalOvos: entregas.reduce((sum, entrega) => sum + entrega.quantidade, 0),
    condominios: condominios.length,
  }
}

export function sortGroupsByRouteOrder(
  groups: CondominioEntregaGroup[],
  orderedIds: string[],
): CondominioEntregaGroup[] {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]))

  return [...groups].sort((a, b) => {
    const orderA = orderMap.get(a.condominioId) ?? Number.MAX_SAFE_INTEGER
    const orderB = orderMap.get(b.condominioId) ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
}

export function statusColor(status: EntregaStatus): string {
  switch (status) {
    case 'entregue':
      return 'bg-success/10 text-success'
    case 'em_rota':
      return 'bg-primary/10 text-primary'
    case 'separado':
      return 'bg-warning/10 text-warning'
    default:
      return 'bg-muted/10 text-muted'
  }
}
