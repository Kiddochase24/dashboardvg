import { createAppKit, type AppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  base,
} from "@reown/appkit/networks";

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
    __vgAppKit?: AppKit | null;
  }
}

export type WalletProvider = "metamask" | "coinbase" | "phantom" | "trust" | "rainbow" | "walletconnect" | "import";

// Read from VITE_WALLETCONNECT_PROJECT_ID env var (set in Netlify / Cloudflare /
// local .env before building). Never hardcoded so you control which project is used.
const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string ?? "";

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

// ─── Reown AppKit (official WalletConnect modal — 250+ EVM wallets) ──────────
// IMPORTANT: SolanaAdapter is intentionally NOT included. Its syncConnectors()
// method fires APKT008 "Project ID Missing" before the base client has a chance
// to set OptionsController.state.projectId — a timing bug that causes AppKit to
// display an error alert inside the modal instead of the wallet list.
// Solana users can still connect via the direct Phantom option.

function buildAppKit(): AppKit {
  return createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet, polygon, arbitrum, optimism, bsc, base],
    projectId: WC_PROJECT_ID,
    metadata: {
      name: "VaultGuard",
      description: "Web3 Wallet Security Dashboard",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
    allowUnsupportedChain: true,
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
  });
}

function getAppKit(): AppKit {
  if (window.__vgAppKit) return window.__vgAppKit;
  const kit = buildAppKit();
  window.__vgAppKit = kit;
  return kit;
}

/** Pre-warm AppKit on page load so the modal opens instantly on click. */
export function preInitWalletConnect(): void {
  try { getAppKit(); } catch { /* ignore pre-init errors */ }
}

// ─── Wallet connect functions ─────────────────────────────────────────────────

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

/**
 * Open the Reown AppKit modal (250+ EVM wallets) and resolve with the
 * connected address. AppKit manages sessions internally so repeated calls work.
 */
export async function connectWalletConnect(): Promise<string> {
  const kit = getAppKit();

  // Disconnect any existing session so the wallet picker always shows fresh
  try {
    if (kit.getIsConnectedState()) {
      await kit.disconnect();
    }
  } catch { /* ignore */ }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      try { unsubAcct?.(); } catch { /* ignore */ }
      try { unsubState?.(); } catch { /* ignore */ }
      fn();
    };

    const checkAddress = (): string | null => {
      const evm = kit.getAddress("eip155");
      if (evm) return evm;
      const any = kit.getAddress();
      return any ?? null;
    };

    const unsubAcct = kit.subscribeAccount((acct) => {
      if (acct?.isConnected) {
        const addr = checkAddress();
        if (addr) finish(() => resolve(addr));
      }
    });

    const unsubState = kit.subscribeState((state) => {
      if (state.open === false) {
        setTimeout(() => {
          if (settled) return;
          const addr = checkAddress();
          if (addr) finish(() => resolve(addr));
          else finish(() => reject(new Error("Connection cancelled.")));
        }, 200);
      }
    });

    kit.open().catch((err) => {
      finish(() => reject(err instanceof Error ? err : new Error("Failed to open WalletConnect.")));
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
    case "import":
      throw new Error("Use manual import flow");
    default:
      throw new Error("Unknown wallet");
  }
}

// ─── Balance / Portfolio helpers ──────────────────────────────────────────────

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
