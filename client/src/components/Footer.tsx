import { useNavigate } from "react-router-dom"

export function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="#d4a017" />
                <text x="50" y="62" textAnchor="middle" fill="#1C1C1C" fontSize="36" fontWeight="800" fontFamily="Inter,sans-serif">M</text>
              </svg>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", fontWeight: 700 }}>MarketPulse</span>
            </div>
            <p className="footer-brand-text">
              Live precious metals prices and financial market news. Track gold, silver, platinum, and palladium with real-time market data and analysis.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Markets</h4>
            <button className="footer-link" onClick={() => navigate("/crypto")}>Crypto</button>
            <button className="footer-link" onClick={() => navigate("/stocks")}>Stocks</button>
            <button className="footer-link" onClick={() => navigate("/commodities")}>Commodities</button>
            <button className="footer-link" onClick={() => navigate("/news")}>All News</button>
          </div>

          <div>
            <h4 className="footer-heading">Company</h4>
            <button className="footer-link">About</button>
            <button className="footer-link">Privacy</button>
            <button className="footer-link">Terms</button>
            <button className="footer-link">Contact</button>
          </div>

          <div>
            <h4 className="footer-heading">Resources</h4>
            <button className="footer-link" onClick={() => navigate("/")}>Home</button>
            <button className="footer-link">Sitemap</button>
            <button className="footer-link">RSS Feed</button>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} MarketPulse. All rights reserved.
          </p>
          <p className="footer-copyright">
            Data provided for informational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
