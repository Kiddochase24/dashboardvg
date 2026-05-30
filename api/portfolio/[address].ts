export default async function handler(req: any, res: any) {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ error: 'Address required' })
  }

  const keysStr = process.env.ZAPPER_API_KEYS || ''
  if (!keysStr) {
    return res.status(500).json({ error: 'Zapper API key not configured' })
  }

  const keys = keysStr.split(',').map((k: string) => k.trim()).filter(Boolean)
  const apiKey = keys[Math.floor(Math.random() * keys.length)]

  try {
    const response = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': apiKey,
      },
      body: JSON.stringify({
        query: `query TokenBalances($addresses: [Address!]!) {
          portfolioV2(addresses: $addresses) {
            tokenBalances {
              totalBalanceUSD
              byToken(first: 5) {
                edges {
                  node { symbol balance balanceUSD imgUrlV2 }
                }
              }
            }
          }
        }`,
        variables: { addresses: [address] },
      }),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Zapper error' })
    }

    const data = await response.json()
    const portfolio = data.data?.portfolioV2?.tokenBalances

    if (!portfolio) {
      return res.json({ totalUSD: 0, holdingsCount: 0, topHoldings: [] })
    }

    const topHoldings = (portfolio.byToken?.edges || []).map((edge: any) => ({
      symbol: edge.node.symbol,
      amount: edge.node.balance,
      valueUSD: edge.node.balanceUSD,
      logo: edge.node.imgUrlV2 || null,
    }))

    return res.json({
      totalUSD: portfolio.totalBalanceUSD || 0,
      holdingsCount: topHoldings.length,
      chainBalances: {},
      topHoldings,
    })
  } catch (err) {
    console.error('Zapper proxy error:', err)
    return res.status(500).json({ error: 'Failed to fetch portfolio data' })
  }
}
