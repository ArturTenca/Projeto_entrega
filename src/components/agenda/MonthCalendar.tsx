import { ArrowButton } from '@/components/ui/ArrowButton'
import {
  addMonths,
  formatMonthYear,
  getMonthGrid,
  isToday,
  toDateISO,
} from '@/lib/dates'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface MonthCalendarProps {
  month: Date
  selectedDate: Date
  counts: Record<string, number>
  onMonthChange: (month: Date) => void
  onSelectDate: (date: Date) => void
}

export function MonthCalendar({
  month,
  selectedDate,
  counts,
  onMonthChange,
  onSelectDate,
}: MonthCalendarProps) {
  const cells = getMonthGrid(month)
  const selectedIso = toDateISO(selectedDate)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <ArrowButton
          direction="left"
          aria-label="Mês anterior"
          onClick={() => onMonthChange(addMonths(month, -1))}
        />
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold capitalize text-secondary">
          {formatMonthYear(month)}
        </p>
        <ArrowButton
          direction="right"
          aria-label="Próximo mês"
          onClick={() => onMonthChange(addMonths(month, 1))}
        />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
        {WEEKDAYS.map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }) => {
          const iso = toDateISO(date)
          const count = counts[iso] ?? 0
          const selected = iso === selectedIso
          const today = isToday(date)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(date)}
              className={[
                'flex min-h-12 flex-col items-center justify-center rounded-[var(--radius-button)] text-sm transition-colors duration-150',
                inMonth ? 'text-secondary' : 'text-muted/50',
                selected
                  ? 'bg-primary text-white'
                  : today
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-card',
              ].join(' ')}
            >
              <span className="font-medium">{date.getDate()}</span>
              {count > 0 ? (
                <span
                  className={[
                    'mt-0.5 text-[10px] font-semibold',
                    selected ? 'text-white' : 'text-primary',
                  ].join(' ')}
                >
                  {count}
                </span>
              ) : (
                <span className="mt-0.5 h-3" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
