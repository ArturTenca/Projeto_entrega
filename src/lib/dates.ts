export function toDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function shiftDate(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isToday(date: Date): boolean {
  return toDateISO(date) === toDateISO(new Date())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function getMonthGrid(month: Date): Array<{ date: Date; inMonth: boolean }> {
  const first = startOfMonth(month)
  const startOffset = first.getDay()
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()
  const cells: Array<{ date: Date; inMonth: boolean }> = []

  for (let index = 0; index < startOffset; index += 1) {
    const date = new Date(first)
    date.setDate(first.getDate() - (startOffset - index))
    cells.push({ date, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(month.getFullYear(), month.getMonth(), day),
      inMonth: true,
    })
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date
    const date = new Date(last)
    date.setDate(last.getDate() + 1)
    cells.push({ date, inMonth: false })
  }

  return cells
}
