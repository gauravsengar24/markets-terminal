export const REGIONS = [
  "USA", "Europe", "China", "Japan", "India", "Korea", "Australia",
] as const

export const ASSET_CLASSES = [
  "oil", "stocks", "crypto", "commodities", "ETFs", "mutual_funds",
] as const

export const REGION_SEARCH: Record<string, string> = {
  USA: "US stock market equities",
  Europe: "European stock market FTSE DAX",
  China: "China stock market Shanghai",
  Japan: "Japan stock market Nikkei",
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
  oil: ["crude oil price", "oil market supply"],
  stocks: ["stock market", "equities index"],
  crypto: ["bitcoin ethereum crypto", "cryptocurrency blockchain defi", "ICO initial coin offering", "IPO public offering"],
  commodities: ["gold silver copper", "commodities market"],
  ETFs: ["ETF fund flow"],
  mutual_funds: ["mutual fund performance"],
}

export const DEFAULT_ASSET_QUERIES = [
  "stock market today global",
  "world economy finance",
  "international business news",
  "global markets trading",
]
