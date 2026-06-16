import { Button } from '@/components/ui/Button'
import { formatDisplayDate, isToday, shiftDate } from '@/lib/dates'

interface DateSelectorProps {
  date: Date
  onChange: (date: Date) => void
}

export function DateSelector({ date, onChange }: DateSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(shiftDate(date, -1))}
        aria-label="Dia anterior"
      >
        ←
      </Button>

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-sm capitalize text-muted">
          {formatDisplayDate(date)}
        </p>
        {!isToday(date) ? (
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={() => onChange(new Date())}
          >
            Voltar para hoje
          </button>
        ) : (
          <p className="text-xs font-medium text-primary">Hoje</p>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(shiftDate(date, 1))}
        aria-label="Próximo dia"
      >
        →
      </Button>
    </div>
  )
}
