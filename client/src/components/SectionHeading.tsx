interface Props {
  children: string
  count?: number
}

export function SectionHeading({ children, count }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 md:px-5 py-2">
      <h2 className="mac-section-title">{children}</h2>
      {count !== undefined && (
        <span className="mac-count-badge">{count}</span>
      )}
    </div>
  )
}
