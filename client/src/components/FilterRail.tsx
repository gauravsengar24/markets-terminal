import { REGIONS, ASSET_CLASSES } from "@shared/constants"

interface Props {
  regions: string[]
  assets: string[]
  onToggleRegion: (r: string) => void
  onToggleAsset: (a: string) => void
}

export function FilterRail({ regions, assets, onToggleRegion, onToggleAsset }: Props) {
  const active = (list: string[], item: string) => list.length === 0 || list.includes(item)

  return (
    <div className="w-44 shrink-0 overflow-y-auto bg-term-surface p-2">
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-term-accent uppercase tracking-widest mb-2 px-1">Region</h3>
        {REGIONS.map((r) => (
          <button key={r} onClick={() => onToggleRegion(r)}
            className={`w-full text-left text-[11px] px-2 py-1 cursor-pointer transition-colors border-l-2 ${
              active(regions, r)
                ? "bg-term-accent/10 text-term-accent border-term-accent"
                : "text-term-muted hover:text-term-text border-transparent hover:bg-term-bg"
            }`}>{r}</button>
        ))}
      </div>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-term-cyan uppercase tracking-widest mb-2 px-1">Asset</h3>
        {ASSET_CLASSES.map((ac) => (
          <button key={ac} onClick={() => onToggleAsset(ac)}
            className={`w-full text-left text-[11px] px-2 py-1 cursor-pointer transition-colors border-l-2 ${
              active(assets, ac)
                ? "bg-term-cyan/10 text-term-cyan border-term-cyan"
                : "text-term-muted hover:text-term-text border-transparent hover:bg-term-bg"
            }`}>{ac.replace("_", " ")}</button>
        ))}
      </div>
      {(regions.length || assets.length) ? (
        <button onClick={() => { regions.forEach(onToggleRegion); assets.forEach(onToggleAsset) }}
          className="w-full text-left text-[10px] text-term-muted hover:text-term-red px-2 py-1 border-t border-term-border pt-3 cursor-pointer transition-colors">
          clear all filters
        </button>
      ) : null}
    </div>
  )
}
