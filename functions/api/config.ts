export async function onRequestGet(context: any) {
  return Response.json({
    walletConnectProjectId: context.env.WALLETCONNECT_PROJECT_ID || '',
  })
}
