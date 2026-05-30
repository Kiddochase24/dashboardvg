import type { Config } from '@netlify/functions'

let zapperKeyIndex = 0

function getZapperKey(): string {
  const keysStr =
    Netlify.env.get('ZAPPER_API_KEYS') ||
    Netlify.env.get('VITE_ZAPPER_KEYS') ||
    Netlify.env.get('VITE_ZAPPER_KEY') ||
    ''
  if (!keysStr) return ''
  const keys = keysStr.split(',').map((k) => k.trim()).filter(Boolean)
  if (keys.length === 0) return ''
  const key = keys[zapperKeyIndex % keys.length]
  zapperKeyIndex++
  return key
}

export default async (req: Request) => {
  const url = new URL(req.url)
  const address = url.pathname.split('/').pop()

  if (!address) {
    return Response.json({ error: 'Address required' }, { status: 400 })
  }

  const apiKey = getZapperKey()
  if (!apiKey) {
    return Response.json({ error: 'Zapper API key not configured' }, { status: 500 })
  }

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
                  node {
                    symbol
                    balance
                    balanceUSD
                    imgUrlV2
                  }
                }
              }
            }
          }
        }`,
        variables: { addresses: [address] },
      }),
    })

    if (!response.ok) {
      return Response.json({ error: 'Zapper GraphQL error' }, { status: response.status })
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

export const config: Config = {
  path: '/api/portfolio/:address',
}
