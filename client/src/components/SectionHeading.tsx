interface Props {
  children: string
}

export function SectionHeading({ children }: Props) {
  return (
    <div className="px-3 md:px-5 py-3 md:py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h2 className="section-heading-glass">{children}</h2>
    </div>
  )
}
