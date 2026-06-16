type ArrowDirection = 'left' | 'right'

interface ArrowButtonProps {
  direction: ArrowDirection
  onClick: () => void
  'aria-label': string
  disabled?: boolean
  className?: string
}

function ChevronIcon({ direction }: { direction: ArrowDirection }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'left' ? (
        <path d="M14 6l-6 6 6 6" />
      ) : (
        <path d="M10 6l6 6-6 6" />
      )}
    </svg>
  )
}

export function ArrowButton({
  direction,
  onClick,
  'aria-label': ariaLabel,
  disabled = false,
  className = '',
}: ArrowButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        'border border-border bg-secondary/5 text-secondary',
        'transition-colors duration-150',
        'hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChevronIcon direction={direction} />
    </button>
  )
}
