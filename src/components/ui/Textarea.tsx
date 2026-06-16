import { type TextareaHTMLAttributes, useId } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function Textarea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={textareaId} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={[
          'min-h-24 w-full rounded-[var(--radius-button)] border bg-card px-4 py-3 text-base text-secondary',
          'placeholder:text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          error ? 'border-error' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
