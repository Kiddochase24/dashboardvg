declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signMessage: (msg: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
    };
  }
}

export type WalletProvider = "metamask" | "coinbase" | "phantom" | "trust" | "rainbow" | "walletconnect";

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export function hasEthereumProvider(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export function hasPhantomProvider(): boolean {
  return typeof window !== "undefined" && !!window.solana?.isPhantom;
}

export function isMetaMaskProvider(): boolean {
  return hasEthereumProvider() && !!window.ethereum?.isMetaMask;
}

export function isCoinbaseProvider(): boolean {
  return hasEthereumProvider() && !!window.ethereum?.isCoinbaseWallet;
}

export function getWalletDeepLink(walletId: WalletProvider): string {
  const url = encodeURIComponent(window.location.href);
  const host = window.location.hostname;
  switch (walletId) {
    case "metamask":
      return `https://metamask.app.link/dapp/${host}`;
    case "trust":
      return `https://link.trustwallet.com/open_url?coin_id=60&url=${url}`;
    case "rainbow":
      return `https://rnbwapp.com/wc?uri=${url}`;
    case "coinbase":
      return `https://go.cb-w.com/dapp?cb_url=${url}`;
    case "walletconnect":
      return `https://walletconnect.com/`;
    default:
      return `https://metamask.app.link/dapp/${host}`;
  }
}

export async function connectMetaMask(): Promise<string> {
  if (!hasEthereumProvider()) {
    if (isMobile()) {
      window.location.href = getWalletDeepLink("metamask");
      return "";
    }
    throw new Error("MetaMask not installed. Please install the MetaMask browser extension.");
  }
  const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("No accounts returned from MetaMask.");
  return accounts[0];
}

export async function connectCoinbase(): Promise<string> {
  if (!hasEthereumProvider()) {
    if (isMobile()) {
      window.location.href = getWalletDeepLink("coinbase");
      return "";
    }
    throw new Error("Coinbase Wallet not detected. Install the extension or use the mobile app.");
  }
  const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("No accounts returned.");
  return accounts[0];
}

export async function connectPhantom(): Promise<string> {
  if (!hasPhantomProvider()) {
    if (isMobile()) {
      const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`;
      window.location.href = phantomDeepLink;
      return "";
    }
    window.open("https://phantom.app", "_blank");
    throw new Error("Phantom wallet not installed. Please install the Phantom browser extension.");
  }
  const resp = await window.solana!.connect();
  return resp.publicKey.toString();
}

export function openMobileWallet(walletId: WalletProvider): void {
  window.location.href = getWalletDeepLink(walletId);
}

export async function connectWallet(walletId: WalletProvider): Promise<string> {
  switch (walletId) {
    case "metamask":
      return connectMetaMask();
    case "coinbase":
      return connectCoinbase();
    case "phantom":
      return connectPhantom();
    case "trust":
    case "rainbow":
    case "walletconnect":
      openMobileWallet(walletId);
      return "";
    default:
      throw new Error("Unknown wallet");
  }
}

export async function getEVMBalance(address: string): Promise<string> {
  try {
    const res = await fetch("https://eth.llamarpc.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });
    const data = await res.json();
    if (!data.result) return "0.0000";
    const balanceWei = BigInt(data.result);
    const balanceEth = Number(balanceWei) / 1e18;
    return balanceEth.toFixed(6);
  } catch {
    return null as unknown as string;
  }
}

export async function getSolanaBalance(address: string): Promise<string> {
  try {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    const data = await res.json();
    const lamports = data.result?.value ?? 0;
    return (lamports / 1e9).toFixed(4);
  } catch {
    return null as unknown as string;
  }
}

export async function getBalance(address: string): Promise<string | null> {
  if (!address) return null;
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return getEVMBalance(address);
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return getSolanaBalance(address);
  return null;
}

export async function requestWalletSignature(address: string): Promise<string> {
  if (!hasEthereumProvider() && !hasPhantomProvider()) {
    throw new Error("No wallet provider detected. Please open this page inside your wallet app.");
  }
  const timestamp = new Date().toISOString();
  const nonce = Math.floor(Math.random() * 1000000);
  const message =
    `VaultGuard Security Verification\n` +
    `═══════════════════════════════\n\n` +
    `Wallet: ${address}\n` +
    `Action: Verify wallet ownership\n` +
    `Nonce: ${nonce}\n` +
    `Time: ${timestamp}\n\n` +
    `Signing this message proves you own this\n` +
    `wallet. No funds will be moved.`;

  if (hasEthereumProvider()) {
    const sig = await window.ethereum!.request({
      method: "personal_sign",
      params: [message, address],
    });
    return sig as string;
  }

  if (hasPhantomProvider()) {
    const encoded = new TextEncoder().encode(message);
    const { signature } = await window.solana!.signMessage(encoded, "utf8");
    return Buffer.from(signature).toString("hex");
  }

  throw new Error("No wallet provider available.");
}
