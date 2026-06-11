export const REGIONS = [
  "USA", "Europe", "China", "Japan", "India", "Korea", "Australia", "Middle East",
] as const

export const ASSET_CLASSES = [
  "oil", "stocks", "crypto", "commodities", "ETFs", "mutual_funds",
] as const

export const SECTION_TYPES = [
  "crypto", "stocks", "commodities", "ipo",
] as const

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  "tech-founder": ["elon", "musk", "bezos", "zuckerberg", "altman", "sam altman", "gates", "bill gates", "tim cook", "pichai", "sundar", "nadal", "jensen", "huang", "nvidia ceo", "metaverse", "openai", "google ceo", "apple ceo", "microsoft ceo", "tesla ceo", "founder", "co-founder"],
  "politics-leader": ["president", "prime minister", "chancellor", "modi", "biden", "trump", "xi jinping", "putin", "macron", "scholz", "sunak", "lula", "election", "summit", "g20", "g7", "white house", "congress", "parliament"],
  "ipo": ["ipo", "initial public offering", "ipo filing", "goes public", "listing", "stock market debut", "direct listing", "spac"],
  "war-conflict": ["war", "ukraine", "russia", "gaza", "israel", "hamas", "conflict", "military", "missile", "sanction", "defense", "nato", "troops", "invasion", "ceasefire", "hostage", "refugee"],
  "crypto-defi": ["defi", "decentralized finance", "rwa", "real world assets", "tokenization", "lending protocol", "liquid staking", "layer 2", "l2", "ethereum etf", "bitcoin etf", "solana", "layer1", "bridge", "cross-chain", "uniswap", "aave", "compound", "makerdao", "ethena"],
  "crypto-regulation": ["sec", "crypto regulation", "bitcoin", "crypto ban", "crypto law", "stablecoin", "cbdc", "digital dollar", "crypto policy"],
  "trending": ["breaking", "just in", "exclusive", "first", "milestone", "record", "historic", "landmark", "breakthrough", "unveiled", "launch"],
}

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
  { url: 'https://cointelegraph.com/rss', region: 'USA', subCategory: 'crypto' },
  { url: 'https://cryptonews.com/news/feed/', region: 'USA', subCategory: 'crypto' },
  { url: 'https://news.bitcoin.com/feed/', region: 'USA', subCategory: 'crypto' },
  { url: 'https://u.today/rss', region: 'USA', subCategory: 'crypto' },
  { url: 'https://cryptoslate.com/feed/', region: 'USA', subCategory: 'crypto' },
  { url: 'https://www.newsbtc.com/feed/', region: 'USA', subCategory: 'crypto' },
  { url: 'https://www.investing.com/rss/news.rss', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.content.dowjones.io/public/rss/markets', region: 'USA', subCategory: 'stocks' },
  { url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=markets-news', region: 'USA', subCategory: 'stocks' },
  { url: 'https://www.moneycontrol.com/rss/marketstocks.xml', region: 'India', subCategory: 'stocks' },
  { url: 'https://www.business-standard.com/rss/markets-101.rss', region: 'India', subCategory: 'stocks' },
  { url: 'https://www.thehindubusinessline.com/feed/', region: 'India', subCategory: 'stocks' },
  { url: 'https://asia.nikkei.com/rss/feed', region: 'Japan', subCategory: 'stocks' },
  { url: 'https://techcrunch.com/feed/', region: 'USA', subCategory: 'tech' },
  { url: 'https://www.theverge.com/rss/index.xml', region: 'USA', subCategory: 'tech' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', region: 'USA', subCategory: 'tech' },
  { url: 'https://www.zerohedge.com/rss.xml', region: 'USA', subCategory: 'stocks' },
  { url: 'https://seekingalpha.com/feed.xml', region: 'USA', subCategory: 'stocks' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', region: 'Middle East', subCategory: 'politics' },
  { url: 'https://www.france24.com/en/rss', region: 'Europe', subCategory: 'politics' },
  { url: 'https://rss.dw.com/rdf/rss-en-world', region: 'Europe', subCategory: 'politics' },
  { url: 'https://www.thehindu.com/news/feed/', region: 'India', subCategory: 'politics' },
  { url: 'https://www.rediff.com/rss/inrss.xml', region: 'India', subCategory: 'politics' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', region: 'USA', subCategory: 'tech' },
  { url: 'https://www.wired.com/feed/rss', region: 'USA', subCategory: 'tech' },
  { url: 'https://decrypt.co/feed', region: 'USA', subCategory: 'crypto-defi' },
  { url: 'https://blockworks.co/feed', region: 'USA', subCategory: 'crypto-defi' },
  { url: 'https://fortune.com/feed', region: 'USA', subCategory: 'stocks' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', region: 'Europe', subCategory: 'politics' },
  { url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', region: 'USA', subCategory: 'stocks' },
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
]
