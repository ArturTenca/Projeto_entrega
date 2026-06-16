import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import { fetchClientes } from '@/features/clientes/api'
import {
  createPedido,
  deletePedido,
  fetchPedidos,
  updatePedido,
} from '@/features/pedidos/api'
import {
  parsePedidoPayload,
  PedidoForm,
  type PedidoFormValues,
} from '@/features/pedidos/PedidoForm'
import { fetchProdutos } from '@/features/produtos/api'
import type { ClienteComCondominio, PedidoComCliente, Produto } from '@/types/database'
import { DIA_SEMANA_LABEL, PEDIDO_STATUS_LABEL } from '@/types/database'

type PedidoModal = { mode: 'create' } | { mode: 'edit'; item: PedidoComCliente }

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [clientes, setClientes] = useState<ClienteComCondominio[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<PedidoModal | null>(null)
  const [deleteItem, setDeleteItem] = useState<PedidoComCliente | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [pedidosResult, clientesResult, produtosResult] = await Promise.all([
      fetchPedidos(),
      fetchClientes(),
      fetchProdutos(),
    ])

    setPedidos(pedidosResult.data)
    setClientes(clientesResult.data)
    setProdutos(produtosResult.data)
    setError(
      pedidosResult.error ?? clientesResult.error ?? produtosResult.error,
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(values: PedidoFormValues) {
    setSaving(true)
    const payload = parsePedidoPayload(values)

    const result =
      modal?.mode === 'edit'
        ? await updatePedido(modal.item.id, payload)
        : await createPedido(payload)

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setModal(null)
    await load()
  }

  async function confirmDelete() {
    if (!deleteItem) return

    setSaving(true)
    const result = await deletePedido(deleteItem.id)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setDeleteItem(null)
    await load()
  }

  if (loading) {
    return <LoadingState message="Carregando pedidos..." />
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-secondary">Pedidos</h1>
        <p className="mt-1 text-sm text-muted">
          Pedidos recorrentes por dia da semana — visíveis para todos.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button fullWidth onClick={() => setModal({ mode: 'create' })}>
        + Novo pedido
      </Button>

      {clientes.length === 0 || produtos.length === 0 ? (
        <Card>
          <EmptyState
            title={
              clientes.length === 0
                ? 'Cadastre clientes primeiro'
                : 'Cadastre produtos primeiro'
            }
            description={
              clientes.length === 0
                ? 'Vá em Clientes para adicionar antes de criar pedidos.'
                : 'Vá em Produtos para adicionar itens aos pedidos.'
            }
          />
        </Card>
      ) : pedidos.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum pedido cadastrado" />
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <Card key={pedido.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-secondary">
                    {pedido.clientes.nome}
                  </h3>
                  <p className="text-sm text-muted">
                    {DIA_SEMANA_LABEL[pedido.dia_semana]} ·{' '}
                    {pedido.produtos?.nome ?? 'Sem produto'} · {pedido.quantidade}{' '}
                    un.
                  </p>
                  {pedido.clientes.condominios ? (
                    <p className="text-sm text-muted">
                      {pedido.clientes.condominios.nome}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    pedido.status === 'ativo'
                      ? 'success'
                      : pedido.status === 'pausado'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {PEDIDO_STATUS_LABEL[pedido.status]}
                </Badge>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setModal({ mode: 'edit', item: pedido })}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => setDeleteItem(pedido)}
                >
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        title={modal?.mode === 'edit' ? 'Editar pedido' : 'Novo pedido'}
        onClose={() => setModal(null)}
      >
        <PedidoForm
          initial={modal?.mode === 'edit' ? modal.item : null}
          clientes={clientes}
          produtos={produtos}
          loading={saving}
          onCancel={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal
        open={deleteItem !== null}
        title="Confirmar exclusão"
        onClose={() => setDeleteItem(null)}
      >
        <p className="text-sm text-secondary">
          Excluir o pedido de {deleteItem?.clientes.nome} (
          {deleteItem ? DIA_SEMANA_LABEL[deleteItem.dia_semana] : ''})? Entregas
          geradas também serão removidas.
        </p>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteItem(null)}>
            Cancelar
          </Button>
          <Button variant="danger" fullWidth loading={saving} onClick={confirmDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
