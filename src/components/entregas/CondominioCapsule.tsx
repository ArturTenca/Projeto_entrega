import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { statusColor } from '@/features/entregas/groupByCondominio'
import type { CondominioEntregaGroup } from '@/features/entregas/groupByCondominio'
import { openInWaze } from '@/lib/routing/navigationLinks'
import { ENTREGA_STATUS_LABEL } from '@/types/database'

interface CondominioCapsuleProps {
  group: CondominioEntregaGroup
  ordem?: number
  selected?: boolean
  onSelect?: () => void
}

export function CondominioCapsule({
  group,
  ordem,
  selected = false,
  onSelect,
}: CondominioCapsuleProps) {
  const hasCoordinates = group.latitude !== null && group.longitude !== null

  return (
    <Card
      variant="important"
      className={[
        'cursor-pointer transition-colors duration-150',
        selected ? 'border-primary ring-2 ring-primary/20' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {ordem ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {ordem}
              </span>
            ) : null}
            <h3 className="truncate font-semibold text-secondary">{group.nome}</h3>
          </div>

          {group.endereco ? (
            <p className="mt-1 truncate text-sm text-muted">{group.endereco}</p>
          ) : null}
        </div>

        {hasCoordinates ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              openInWaze(group.latitude!, group.longitude!)
            }}
          >
            Waze
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="primary">{group.totalOvos} itens</Badge>
        <Badge>{group.clientesUnicos} clientes</Badge>
        {group.pendentes > 0 ? (
          <Badge variant="warning">{group.pendentes} pendentes</Badge>
        ) : null}
        {group.entregues > 0 ? (
          <Badge variant="success">{group.entregues} entregues</Badge>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2">
        {group.entregas.map((entrega) => (
          <li
            key={entrega.id}
            className="flex items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-secondary">
                {entrega.pedidos.clientes.nome}
              </p>
              <p className="text-xs text-muted">
                {entrega.pedidos.produtos?.nome ?? 'Item'} · {entrega.quantidade}{' '}
                un.
              </p>
            </div>
            <span
              className={[
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                statusColor(entrega.status),
              ].join(' ')}
            >
              {ENTREGA_STATUS_LABEL[entrega.status]}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
