import type { EntregaFinanceira } from './api'

export interface FinanceiroFiltros {
  clienteId: string
  produtoId: string
}

export interface Totais {
  faturado: number
  gasto: number
  lucro: number
  entregas: number
  itens: number
}

export interface RankingItem {
  id: string
  nome: string
  quantidade: number
  faturado: number
  lucro: number
}

export interface MesResumo {
  key: string
  faturado: number
  gasto: number
  lucro: number
}

const SEM_PRODUTO = 'sem-produto'

interface Linha {
  mes: string
  clienteId: string
  clienteNome: string
  produtoId: string
  produtoNome: string
  quantidade: number
  faturado: number
  gasto: number
}

/**
 * Usa o valor congelado na entrega; se não houver (entregas antigas),
 * cai no preço atual do produto.
 */
function toLinha(entrega: EntregaFinanceira): Linha {
  const pedido = entrega.pedidos
  const produto = pedido?.produtos ?? null
  const venda = Number(entrega.valor_unitario_venda ?? produto?.preco_venda ?? 0)
  const custo = Number(entrega.valor_unitario_custo ?? produto?.preco_custo ?? 0)

  return {
    mes: entrega.data_prevista.slice(0, 7),
    clienteId: pedido?.cliente_id ?? '',
    clienteNome: pedido?.clientes?.nome ?? 'Cliente removido',
    produtoId: produto?.id ?? SEM_PRODUTO,
    produtoNome: produto?.nome ?? 'Sem produto',
    quantidade: entrega.quantidade,
    faturado: venda * entrega.quantidade,
    gasto: custo * entrega.quantidade,
  }
}

function emptyTotais(): Totais {
  return { faturado: 0, gasto: 0, lucro: 0, entregas: 0, itens: 0 }
}

function rank(
  linhas: Linha[],
  key: (linha: Linha) => [string, string],
): RankingItem[] {
  const map = new Map<string, RankingItem>()

  for (const linha of linhas) {
    const [id, nome] = key(linha)
    const item = map.get(id) ?? { id, nome, quantidade: 0, faturado: 0, lucro: 0 }
    item.quantidade += linha.quantidade
    item.faturado += linha.faturado
    item.lucro += linha.faturado - linha.gasto
    map.set(id, item)
  }

  return [...map.values()]
}

export function computeFinanceiro(
  entregas: EntregaFinanceira[],
  mesSelecionado: string,
  meses: string[],
  filtros: FinanceiroFiltros,
) {
  const linhas = entregas
    .map(toLinha)
    .filter(
      (linha) =>
        (!filtros.clienteId || linha.clienteId === filtros.clienteId) &&
        (!filtros.produtoId || linha.produtoId === filtros.produtoId),
    )

  const historico = new Map<string, MesResumo>(
    meses.map((key) => [key, { key, faturado: 0, gasto: 0, lucro: 0 }]),
  )
  const totais = emptyTotais()
  const doMes: Linha[] = []

  for (const linha of linhas) {
    const mes = historico.get(linha.mes)
    if (mes) {
      mes.faturado += linha.faturado
      mes.gasto += linha.gasto
      mes.lucro += linha.faturado - linha.gasto
    }

    if (linha.mes !== mesSelecionado) continue

    doMes.push(linha)
    totais.faturado += linha.faturado
    totais.gasto += linha.gasto
    totais.entregas += 1
    totais.itens += linha.quantidade
  }

  totais.lucro = totais.faturado - totais.gasto

  return {
    totais,
    historico: [...historico.values()],
    produtos: rank(doMes, (linha) => [linha.produtoId, linha.produtoNome]).sort(
      (a, b) => b.quantidade - a.quantidade,
    ),
    clientes: rank(doMes, (linha) => [linha.clienteId, linha.clienteNome]).sort(
      (a, b) => b.faturado - a.faturado,
    ),
  }
}
