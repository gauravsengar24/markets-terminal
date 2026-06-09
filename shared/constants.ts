export const REGIONS = [
  "USA", "Europe", "China", "Japan", "India", "Korea", "Australia",
] as const

export const ASSET_CLASSES = [
  "oil", "stocks", "crypto", "commodities", "ETFs", "mutual_funds",
] as const

export const SECTION_TYPES = [
  "crypto", "stocks", "commodities", "ipo",
] as const

export const REGION_SEARCH: Record<string, string> = {
  USA: "US stock market equities Wall Street",
  Europe: "European stock market FTSE DAX CAC",
  China: "China stock market Shanghai Shenzhen",
  Japan: "Japan stock market Nikkei Topix",
  India: "India stock market Nifty Sensex",
  Korea: "Korea stock market KOSPI",
  Australia: "Australia stock market ASX",
}

export const NEWS_PROVIDERS = [
  { id: "newsdata", label: "NewsData.io" },
  { id: "spidercloud", label: "Spider Cloud" },
  { id: "crawl4ai", label: "Crawl4AI" },
] as const

export const ASSET_QUERIES: Record<string, string[]> = {
  oil: ["crude oil price WTI Brent"],
  stocks: ["stock market today global"],
  crypto: ["bitcoin ethereum crypto news today"],
  commodities: ["gold silver copper commodity prices"],
  ETFs: ["ETF fund flow trading"],
  mutual_funds: ["mutual fund performance"],
}

export const CRYPTO_QUERIES: string[] = [
  "bitcoin ethereum crypto blockchain news",
  "altcoin defi regulation crypto market",
  "solana cardano ripple crypto",
]

export const IPO_QUERIES: Record<string, string[]> = {
  ipo: [
    "upcoming IPO stock market this week",
    "initial public offering latest news",
    "IPO filing prospectus SEBI SEC",
  ],
  ico: [
    "crypto ICO token sale launch",
    "initial coin offering new token listing",
    "cryptocurrency ICO presale",
  ],
}

export const BREAKING_NEWS_QUERIES: Record<string, string> = {
  USA: "breaking news US economy markets today urgent",
  Europe: "breaking news European markets economy urgent",
  China: "breaking news China economy markets urgent",
  Japan: "breaking news Japan economy Nikkei urgent",
  India: "breaking news India economy markets Sensex urgent",
  Korea: "breaking news Korea economy KOSPI urgent",
  Australia: "breaking news Australia economy ASX urgent",
}

export const DEFAULT_ASSET_QUERIES = [
  "stock market today global",
  "world economy finance",
  "international business news",
  "global markets trading",
]

export const RSS_FEEDS: string[] = [
  "https://feeds.content.dowjones.io/public/rss/markets",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://feeds.marketwatch.com/marketwatch/topstories",
  "https://finance.yahoo.com/news/rssindex",
  "https://www.investing.com/rss/news.rss",
  "https://www.bbc.co.uk/news/business/rss.xml",
  "https://feeds.bbci.co.uk/news/technology/rss.xml",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss",
  "https://www.bloomberg.com/feeds/podcasts/etf.xml",
  "https://seekingalpha.com/feed.xml",
  "https://www.cnbc.com/id/100727362/device/rss/rss.html",
]
