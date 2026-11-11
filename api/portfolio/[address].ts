const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const CHAINS: Record<string, string> = {
  'eth-mainnet': 'Ethereum',
  'matic-mainnet': 'Polygon',
  'arbitrum-mainnet': 'Arbitrum',
  'optimism-mainnet': 'Optimism',
  'bsc-mainnet': 'BNB Chain',
  'base-mainnet': 'Base',
}

async function fetchChainHoldings(chainName: string, address: string, apiKey: string) {
  const url = `https://api.covalenthq.com/v1/${chainName}/address/${address}/balances_v2/?quote-currency=USD&no-spam=true&nft=false`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!response.ok) throw new Error(`Balance API ${response.status} on ${chainName}`)
  const json = await response.json()
  return (json.data?.items || [])
    .filter((item: any) => (item.quote ?? 0) > 0)
    .map((item: any) => ({
      symbol: item.contract_ticker_symbol,
      amount: Number(item.balance) / 10 ** item.contract_decimals,
      valueUSD: item.quote,
      logo: item.logo_url || null,
      chain: CHAINS[chainName],
    }))
}

export default async function handler(req: any, res: any) {
  const address = String(req.query.address || '')
  if (!EVM_ADDRESS.test(address)) {
    return res.status(400).json({ error: 'Valid EVM address required' })
  }

  const apiKey = process.env.GOLDRUSH_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Balance API key not configured' })
  }

  try {
    const names = Object.keys(CHAINS)
    const results = await Promise.allSettled(names.map(name => fetchChainHoldings(name, address, apiKey)))
    if (results.every(r => r.status === 'rejected')) {
      return res.status(502).json({ error: 'Balance API error' })
    }

    const holdings = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    holdings.sort((a: any, b: any) => b.valueUSD - a.valueUSD)

    const chainBalances: Record<string, number> = {}
    for (const h of holdings) {
      chainBalances[h.chain] = (chainBalances[h.chain] || 0) + h.valueUSD
    }
    const totalUSD = holdings.reduce((sum: number, h: any) => sum + h.valueUSD, 0)

    return res.json({
      totalUSD,
      holdingsCount: holdings.length,
      chainBalances,
      topHoldings: holdings.slice(0, 5),
    })
  } catch (err) {
    console.error('Balance proxy error:', err)
    return res.status(500).json({ error: 'Failed to fetch portfolio data' })
  }
}
