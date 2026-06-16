import { useCallback, useEffect, useState } from 'react'
import { GemmaWordmark } from '@/components/brand/GemmaWordmark'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import {
  ClienteForm,
  parseClientePayload,
  type ClienteFormValues,
} from '@/features/clientes/ClienteForm'
import {
  createCliente,
  deleteCliente,
  fetchClientes,
  updateCliente,
} from '@/features/clientes/api'
import {
  CondominioForm,
  parseCondominioPayload,
  type CondominioFormValues,
} from '@/features/condominios/CondominioForm'
import {
  createCondominio,
  deleteCondominio,
  fetchCondominios,
  updateCondominio,
} from '@/features/condominios/api'
import { fetchProdutos } from '@/features/produtos/api'
import { formatPhone } from '@/lib/format/phone'
import type { ClienteComCondominio, Condominio, Produto } from '@/types/database'

type ClienteModal = { mode: 'create' } | { mode: 'edit'; item: ClienteComCondominio }
type CondominioModal = { mode: 'create' } | { mode: 'edit'; item: Condominio }
type DeleteTarget =
  | { type: 'cliente'; item: ClienteComCondominio }
  | { type: 'condominio'; item: Condominio }

export function ClientesPage() {
  const [tab, setTab] = useState('clientes')
  const [clientes, setClientes] = useState<ClienteComCondominio[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clienteModal, setClienteModal] = useState<ClienteModal | null>(null)
  const [condominioModal, setCondominioModal] = useState<CondominioModal | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [clientesResult, condominiosResult, produtosResult] = await Promise.all([
      fetchClientes(),
      fetchCondominios(),
      fetchProdutos(),
    ])

    setClientes(clientesResult.data)
    setCondominios(condominiosResult.data)
    setProdutos(produtosResult.data)
    setError(
      clientesResult.error ?? condominiosResult.error ?? produtosResult.error,
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleClienteSubmit(values: ClienteFormValues) {
    setSaving(true)
    const payload = parseClientePayload(values)

    const result =
      clienteModal?.mode === 'edit'
        ? await updateCliente(clienteModal.item.id, payload)
        : await createCliente(payload)

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setClienteModal(null)
    await load()
  }

  async function handleCondominioSubmit(values: CondominioFormValues) {
    setSaving(true)
    const payload = parseCondominioPayload(values)

    const result =
      condominioModal?.mode === 'edit'
        ? await updateCondominio(condominioModal.item.id, payload)
        : await createCondominio(payload)

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setCondominioModal(null)
    await load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setSaving(true)

    const result =
      deleteTarget.type === 'cliente'
        ? await deleteCliente(deleteTarget.item.id)
        : await deleteCondominio(deleteTarget.item.id)

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setDeleteTarget(null)
    await load()
  }

  if (loading) {
    return <LoadingState message="Carregando..." />
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <h1 className="text-xl font-bold text-secondary">Clientes</h1>
        <p className="text-sm text-muted">
          Visível para todos os usuários da <GemmaWordmark className="text-base" />.
        </p>
        <Tabs
          tabs={[
            { id: 'clientes', label: 'Clientes' },
            { id: 'condominios', label: 'Condomínios' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </header>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'clientes' ? (
        <>
          <Button fullWidth onClick={() => setClienteModal({ mode: 'create' })}>
            + Novo cliente
          </Button>

          {clientes.length === 0 ? (
            <Card>
              <EmptyState title="Nenhum cliente cadastrado" />
            </Card>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente) => (
                <Card key={cliente.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-secondary">{cliente.nome}</h3>
                      {cliente.condominios ? (
                        <p className="text-sm text-muted">
                          {cliente.condominios.nome}
                        </p>
                      ) : null}
                      {cliente.telefone ? (
                        <p className="text-sm text-muted">
                          {formatPhone(cliente.telefone)}
                        </p>
                      ) : null}
                      {cliente.produto_favorito ? (
                        <p className="text-xs text-primary">
                          Favorito: {cliente.produto_favorito.nome}
                          {cliente.quantidade_favorita
                            ? ` · ${cliente.quantidade_favorita} un.`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={cliente.ativo ? 'success' : 'default'}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() =>
                        setClienteModal({ mode: 'edit', item: cliente })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      onClick={() =>
                        setDeleteTarget({ type: 'cliente', item: cliente })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Button
            fullWidth
            onClick={() => setCondominioModal({ mode: 'create' })}
          >
            + Novo condomínio
          </Button>

          {condominios.length === 0 ? (
            <Card>
              <EmptyState title="Nenhum condomínio cadastrado" />
            </Card>
          ) : (
            <div className="space-y-3">
              {condominios.map((condominio) => (
                <Card key={condominio.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-secondary">
                        {condominio.nome}
                      </h3>
                      {condominio.endereco ? (
                        <p className="text-sm text-muted">{condominio.endereco}</p>
                      ) : null}
                    </div>
                    <Badge variant={condominio.ativo ? 'success' : 'default'}>
                      {condominio.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() =>
                        setCondominioModal({ mode: 'edit', item: condominio })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      onClick={() =>
                        setDeleteTarget({ type: 'condominio', item: condominio })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={clienteModal !== null}
        title={clienteModal?.mode === 'edit' ? 'Editar cliente' : 'Novo cliente'}
        onClose={() => setClienteModal(null)}
      >
        <ClienteForm
          initial={clienteModal?.mode === 'edit' ? clienteModal.item : null}
          condominios={condominios}
          produtos={produtos}
          loading={saving}
          onCancel={() => setClienteModal(null)}
          onSubmit={handleClienteSubmit}
        />
      </Modal>

      <Modal
        open={condominioModal !== null}
        title={
          condominioModal?.mode === 'edit'
            ? 'Editar condomínio'
            : 'Novo condomínio'
        }
        onClose={() => setCondominioModal(null)}
      >
        <CondominioForm
          initial={
            condominioModal?.mode === 'edit' ? condominioModal.item : null
          }
          loading={saving}
          onCancel={() => setCondominioModal(null)}
          onSubmit={handleCondominioSubmit}
        />
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Confirmar exclusão"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-secondary">
          {deleteTarget?.type === 'cliente'
            ? `Excluir o cliente "${deleteTarget.item.nome}"? Pedidos vinculados também serão removidos.`
            : `Excluir o condomínio "${deleteTarget?.item.nome}"? Clientes ficarão sem condomínio vinculado.`}
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setDeleteTarget(null)}
          >
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
