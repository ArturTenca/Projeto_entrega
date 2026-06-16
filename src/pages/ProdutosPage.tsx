import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import {
  createProduto,
  deleteProduto,
  fetchProdutos,
  updateProduto,
} from '@/features/produtos/api'
import {
  parseProdutoPayload,
  ProdutoForm,
  type ProdutoFormValues,
} from '@/features/produtos/ProdutoForm'
import type { Produto } from '@/types/database'

type ProdutoModal = { mode: 'create' } | { mode: 'edit'; item: Produto }

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ProdutoModal | null>(null)
  const [deleteItem, setDeleteItem] = useState<Produto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchProdutos()
    setProdutos(result.data)
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(values: ProdutoFormValues) {
    setSaving(true)
    const payload = parseProdutoPayload(values)

    const result =
      modal?.mode === 'edit'
        ? await updateProduto(modal.item.id, payload)
        : await createProduto(payload)

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
    const result = await deleteProduto(deleteItem.id)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setDeleteItem(null)
    await load()
  }

  if (loading) {
    return <LoadingState message="Carregando produtos..." />
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-secondary">Produtos</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre os itens para usar nos pedidos e favoritos dos clientes.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button fullWidth onClick={() => setModal({ mode: 'create' })}>
        + Novo produto
      </Button>

      {produtos.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum produto cadastrado" />
        </Card>
      ) : (
        <div className="space-y-3">
          {produtos.map((produto) => (
            <Card key={produto.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-secondary">{produto.nome}</h3>
                <Badge variant={produto.ativo ? 'success' : 'default'}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setModal({ mode: 'edit', item: produto })}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => setDeleteItem(produto)}
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
        title={modal?.mode === 'edit' ? 'Editar produto' : 'Novo produto'}
        onClose={() => setModal(null)}
      >
        <ProdutoForm
          initial={modal?.mode === 'edit' ? modal.item : null}
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
          Excluir o produto &quot;{deleteItem?.nome}&quot;? Pedidos e favoritos
          vinculados perderão essa referência.
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
