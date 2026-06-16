interface TabsProps {
  tabs: Array<{ id: string; label: string }>
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      className="flex gap-2 rounded-[var(--radius-button)] bg-background p-1"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={[
            'min-h-10 flex-1 rounded-[var(--radius-button)] px-3 text-sm font-medium transition-colors duration-150',
            active === tab.id
              ? 'bg-card text-secondary shadow-sm'
              : 'text-muted hover:text-secondary',
          ].join(' ')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
