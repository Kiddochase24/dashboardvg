export default async function handler(_req: any, res: any) {
  res.json({
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  })
}
