interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-10 w-auto' }: LogoProps) {
  return (
    <img
      src="/Vector.png"
      alt="GEMMA"
      className={className}
      width={160}
      height={48}
      decoding="async"
    />
  )
}
