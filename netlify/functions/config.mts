import type { Config } from '@netlify/functions'

export default async () => {
  return Response.json({
    walletConnectProjectId: Netlify.env.get('WALLETCONNECT_PROJECT_ID') || '',
  })
}

export const config: Config = {
  path: '/api/config',
}
