export const REGIONS = [
  "USA", "Europe", "China", "Japan", "India", "Korea", "Australia",
] as const

export const ASSET_CLASSES = [
  "oil", "stocks", "crypto", "commodities", "ETFs", "mutual_funds",
] as const

export const SECTION_TYPES = [
  "crypto", "stocks", "commodities", "ipo",
] as const

export interface RssFeed {
  url: string
  region: string
  subCategory: string
}

export const BREAKING_RSS_FEEDS: RssFeed[] = [
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories', region: 'USA', subCategory: 'stocks' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', region: 'USA', subCategory: 'stocks' },
  { url: 'https://finance.yahoo.com/news/rssindex', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://www.theguardian.com/business/stock-markets/rss', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', region: 'India', subCategory: 'stocks' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat4.xml', region: 'Japan', subCategory: 'stocks' },
  { url: 'https://www.chinadaily.com.cn/rss/business_news.rss', region: 'China', subCategory: 'stocks' },
  { url: 'https://www.abc.net.au/news/feed/51260/rss.xml', region: 'Australia', subCategory: 'stocks' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', region: 'USA', subCategory: 'crypto' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', region: 'USA', subCategory: 'stocks' },
]

export const RSS_FEEDS: RssFeed[] = [
  ...BREAKING_RSS_FEEDS,
  { url: 'https://feeds.marketwatch.com/marketwatch/marketpulse', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.marketwatch.com/marketwatch/stocks', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.marketwatch.com/marketwatch/commodities', region: 'USA', subCategory: 'commodities' },
  { url: 'https://feeds.marketwatch.com/marketwatch/etfs', region: 'USA', subCategory: 'stocks' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', region: 'USA', subCategory: 'stocks' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000100', region: 'USA', subCategory: 'commodities' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000671', region: 'USA', subCategory: 'stocks' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000115', region: 'USA', subCategory: 'stocks' },
  { url: 'https://www.theguardian.com/business/economics/rss', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://www.euronews.com/rss/business', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://www.telegraph.co.uk/business/rss.xml', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', region: 'Europe', subCategory: 'stocks' },
  { url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms', region: 'India', subCategory: 'stocks' },
  { url: 'https://economictimes.indiatimes.com/markets/commodities/rssfeeds/2796838.cms', region: 'India', subCategory: 'commodities' },
  { url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1378982.cms', region: 'India', subCategory: 'stocks' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat3.xml', region: 'Japan', subCategory: 'stocks' },
  { url: 'https://www.abc.net.au/news/feed/51240/rss.xml', region: 'Australia', subCategory: 'stocks' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', region: 'USA', subCategory: 'stocks' },
  { url: 'https://www.investing.com/rss/news.rss', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.content.dowjones.io/public/rss/markets', region: 'USA', subCategory: 'stocks' },
  { url: 'https://cointelegraph.com/rss', region: 'USA', subCategory: 'crypto' },
]
