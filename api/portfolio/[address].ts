export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const address = url.pathname.split('/').pop()

  if (!address) {
    return Response.json({ error: 'Address required' }, { status: 400 })
  }

  const keysStr = process.env.ZAPPER_API_KEYS || ''
  if (!keysStr) {
    return Response.json({ error: 'Zapper API key not configured' }, { status: 500 })
  }

  const keys = keysStr.split(',').map((k) => k.trim()).filter(Boolean)
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
      return Response.json({ error: 'Zapper error' }, { status: response.status })
    }

    const data = await response.json()
    const portfolio = data.data?.portfolioV2?.tokenBalances

    if (!portfolio) {
      return Response.json({ totalUSD: 0, holdingsCount: 0, topHoldings: [] })
    }

    const topHoldings = (portfolio.byToken?.edges || []).map((edge: any) => ({
      symbol: edge.node.symbol,
      amount: edge.node.balance,
      valueUSD: edge.node.balanceUSD,
      logo: edge.node.imgUrlV2,
    }))

    return Response.json({
      totalUSD: portfolio.totalBalanceUSD || 0,
      holdingsCount: topHoldings.length,
      chainBalances: {},
      topHoldings,
    })
  } catch (err) {
    console.error('Zapper proxy error:', err)
    return Response.json({ error: 'Failed to fetch portfolio data' }, { status: 500 })
  }
}
