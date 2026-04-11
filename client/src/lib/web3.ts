import EthereumProvider from "@walletconnect/ethereum-provider";
import { WalletConnectModal } from "@walletconnect/modal";

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

function getWCProjectId(): string {
  return import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";
}

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

export async function connectMetaMask(): Promise<string> {
  if (!hasEthereumProvider()) {
    if (isMobile()) {
      const host = window.location.hostname;
      window.location.href = `https://metamask.app.link/dapp/${host}`;
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
      const url = encodeURIComponent(window.location.href);
      window.location.href = `https://go.cb-w.com/dapp?cb_url=${url}`;
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
      window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`;
      return "";
    }
    window.open("https://phantom.app", "_blank");
    throw new Error("Phantom wallet not installed. Please install the Phantom browser extension.");
  }
  const resp = await window.solana!.connect();
  return resp.publicKey.toString();
}

let wcProviderInstance: InstanceType<typeof EthereumProvider> | null = null;

export async function connectWalletConnect(): Promise<string> {
  const projectId = getWCProjectId();
  if (!projectId) {
    throw new Error("WalletConnect Project ID not configured.");
  }

  if (wcProviderInstance) {
    try { await wcProviderInstance.disconnect(); } catch { /* ignore */ }
    wcProviderInstance = null;
  }

  const modal = new WalletConnectModal({
    projectId,
    chains: ["eip155:1"],
    themeMode: "dark",
  });

  const provider = await EthereumProvider.init({
    projectId,
    chains: [1],
    showQrModal: false,
    optionalChains: [137, 56, 42161, 10],
    metadata: {
      name: "VaultGuard",
      description: "Web3 Wallet Security Dashboard",
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
  });

  wcProviderInstance = provider;

  return new Promise((resolve, reject) => {
    provider.on("display_uri", (uri: string) => {
      modal.openModal({ uri });
    });

    provider.on("connect", () => {
      modal.closeModal();
    });

    provider
      .enable()
      .then((accounts: string[]) => {
        modal.closeModal();
        if (!accounts || accounts.length === 0) {
          reject(new Error("No accounts returned from WalletConnect."));
          return;
        }
        resolve(accounts[0]);
      })
      .catch((err: Error) => {
        modal.closeModal();
        if (
          err?.message?.toLowerCase().includes("user rejected") ||
          err?.message?.toLowerCase().includes("cancelled") ||
          err?.message?.toLowerCase().includes("closed") ||
          err?.message?.toLowerCase().includes("qr modal")
        ) {
          reject(new Error("Connection cancelled."));
        } else {
          reject(err);
        }
      });
  });
}

export async function connectWallet(walletId: WalletProvider): Promise<string> {
  switch (walletId) {
    case "metamask":
      return connectMetaMask();
    case "coinbase":
      return connectCoinbase();
    case "phantom":
      return connectPhantom();
    case "walletconnect":
    case "trust":
    case "rainbow":
      return connectWalletConnect();
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

export interface PortfolioData {
  totalUSD: number;
  holdingsCount: number;
  chainBalances: Record<string, number>;
  topHoldings: Array<{ symbol: string; amount: number; valueUSD: number; logo?: string }>;
}

export async function getPortfolioBalance(address: string): Promise<PortfolioData | null> {
  if (!address) return null;
  
  try {
    const res = await fetch(`/api/portfolio/${address}`);

    if (!res.ok) {
      console.error("Portfolio proxy error:", res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Portfolio fetch error:", err);
    return null;
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
    throw new Error("No wallet provider detected.");
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
