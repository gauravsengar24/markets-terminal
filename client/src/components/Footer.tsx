import { useNavigate } from "react-router-dom"

const FOOTER_LINKS = [
  {
    title: "Markets",
    links: [
      { label: "Crypto", path: "/crypto" },
      { label: "Stocks", path: "/stocks" },
      { label: "Commodities", path: "/commodities" },
      { label: "Forex", path: "/stocks" },
    ],
  },
  {
    title: "Data",
    links: [
      { label: "Market Snapshot", path: "/" },
      { label: "Global Stats", path: "/" },
      { label: "AI Analysis", path: "/" },
      { label: "Impact Reports", path: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "API", path: "/" },
      { label: "Documentation", path: "/" },
      { label: "Status", path: "/" },
      { label: "Changelog", path: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", path: "/" },
      { label: "Privacy", path: "/" },
      { label: "Terms", path: "/" },
      { label: "Contact", path: "/" },
    ],
  },
]

export function Footer() {
  const navigate = useNavigate()

  return (
    <footer
      className="relative z-10 mt-12"
      style={{
        borderTop: "1px solid var(--glass-border)",
        background: "linear-gradient(180deg, transparent, rgba(8,10,14,0.95))",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--color-brand)", boxShadow: "0 0 8px rgba(0,229,255,0.4)" }}
              />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-soft-purple)", animation: "pulse-glow 2s ease-in-out infinite" }} />
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--color-text-tertiary)" }}>
              Real-time market intelligence with AI-powered analysis across crypto, stocks, commodities, and forex.
            </p>
            <div className="flex gap-2">
              {["⟠", "⬡", "◇", "◆"].map((icon, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-xs transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)" }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between pt-6 gap-3"
          style={{ borderTop: "1px solid var(--glass-border)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              &copy; {new Date().getFullYear()} Horizon Terminal. All data provided for informational purposes only.
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 4px rgba(34,197,94,0.5)" }} />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
