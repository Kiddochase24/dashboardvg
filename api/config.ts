export const config = { runtime: 'edge' }

export default async function handler(_request: Request): Promise<Response> {
  return Response.json({
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  })
}
