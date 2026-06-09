export const REGIONS = [
  "USA", "Europe", "China", "Japan", "India", "Korea", "Australia",
] as const

export const ASSET_CLASSES = [
  "oil", "stocks", "crypto", "commodities", "ETFs", "mutual_funds",
] as const

export const TICKERS = [
  { symbol: "WTI", name: "Crude Oil WTI" },
  { symbol: "BRENT", name: "Brent Crude" },
  { symbol: "GOLD", name: "Gold" },
  { symbol: "SPX", name: "S&P 500" },
  { symbol: "DJI", name: "Dow Jones" },
  { symbol: "IXIC", name: "NASDAQ" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "JPY", name: "USD/JPY" },
  { symbol: "EUR", name: "EUR/USD" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ ETF" },
  { symbol: "GLD", name: "SPDR Gold ETF" },
  { symbol: "SLV", name: "iShares Silver ETF" },
] as const

export const REGION_SEARCH: Record<string, string> = {
  USA: "US stock market",
  Europe: "European stock market",
  China: "China stock market",
  Japan: "Japan stock market Nikkei",
  India: "India stock market Nifty Sensex",
  Korea: "Korea stock market KOSPI",
  Australia: "Australia stock market ASX",
}

export const ASSET_QUERIES: Record<string, string[]> = {
  oil: ["crude oil prices", "wti crude", "brent crude", "oil market"],
  stocks: ["stock market today", "equities market", "stock index"],
  crypto: ["bitcoin crypto news", "ethereum crypto", "cryptocurrency market"],
  commodities: ["commodities market", "copper prices", "silver prices"],
  ETFs: ["ETF market flow", "exchange traded fund"],
  mutual_funds: ["mutual funds market", "fund flows"],
}
