interface GemmaWordmarkProps {
  className?: string
}

export function GemmaWordmark({ className = '' }: GemmaWordmarkProps) {
  return (
    <span
      className={[
        'font-gemma text-primary uppercase tracking-wide',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      GEMMA
    </span>
  )
}
