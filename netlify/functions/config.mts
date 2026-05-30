import type { Config } from '@netlify/functions'

export default async () => {
  return Response.json({
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  })
}

export const config: Config = {
  path: '/api/config',
}
