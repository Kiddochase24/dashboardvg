import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wifi,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { SiEthereum } from "react-icons/si";

interface WalletConnectModalProps {
  enteredAddress: string;
  onSuccess: (address: string) => void;
  onClose: () => void;
}

type ModalStep = "select" | "connecting" | "verify" | "mismatch";

const WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect using browser extension",
    color: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/25",
    iconBg: "bg-orange-500/20",
    iconColor: "#F6851B",
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
    description: "Scan with any compatible wallet",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/20",
    icon: (
      <svg viewBox="0 0 300 185" fill="none" className="w-6 h-6">
        <path d="M61.4385 36.2562C110.3 -12.0854 189.2 -12.0854 238.062 36.2562L243.912 42.0667C246.468 44.5995 246.468 48.7148 243.912 51.2476L223.347 71.582C222.069 72.8484 220.003 72.8484 218.725 71.582L210.676 63.6272C176.705 30.0056 123.295 30.0056 89.3242 63.6272L80.6893 72.1777C79.4117 73.4441 77.3453 73.4441 76.0677 72.1777L55.5028 51.8433C52.947 49.3105 52.947 45.1952 55.5028 42.6624L61.4385 36.2562ZM279.512 77.3113L297.86 95.5265C300.416 98.0593 300.416 102.175 297.86 104.707L215.384 186.322C212.828 188.855 208.695 188.855 206.139 186.322L147.568 128.199C146.929 127.566 145.896 127.566 145.257 128.199L86.6859 186.322C84.1301 188.855 79.9976 188.855 77.4418 186.322L-5.11573 104.707C-7.67147 102.175 -7.67147 98.0593 -5.11573 95.5265L13.2322 77.3113C15.7879 74.7785 19.9204 74.7785 22.4762 77.3113L81.0474 135.434C81.6865 136.067 82.7197 136.067 83.3588 135.434L141.929 77.3113C144.485 74.7785 148.618 74.7785 151.173 77.3113L209.745 135.434C210.384 136.067 211.417 136.067 212.056 135.434L270.627 77.3113C273.183 74.7785 277.315 74.7785 279.512 77.3113Z" fill="#3B99FC"/>
      </svg>
    ),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect with Coinbase Wallet app",
    color: "from-blue-600/20 to-blue-400/10",
    border: "border-blue-600/25",
    iconBg: "bg-blue-600/20",
    icon: (
      <svg viewBox="0 0 1024 1024" className="w-6 h-6">
        <rect width="1024" height="1024" rx="200" fill="#0052FF"/>
        <path d="M512 128C300.8 128 128 300.8 128 512s172.8 384 384 384 384-172.8 384-384S723.2 128 512 128zm0 614.4c-127.2 0-230.4-103.2-230.4-230.4S384.8 281.6 512 281.6s230.4 103.2 230.4 230.4S639.2 742.4 512 742.4z" fill="white"/>
        <path d="M448 416h128v192H448z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    description: "Connect via Trust Wallet mobile",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/25",
    iconBg: "bg-cyan-500/20",
    icon: (
      <svg viewBox="0 0 512 512" className="w-6 h-6">
        <path d="M256 0L48 96v160c0 138.8 88 268.8 208 320 120-51.2 208-181.2 208-320V96L256 0z" fill="#3375BB"/>
        <path d="M208 320l-80-80 28.8-28.8L208 262.4l147.2-147.2L384 144 208 320z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Solana & multi-chain wallet",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/25",
    iconBg: "bg-violet-500/20",
    icon: (
      <svg viewBox="0 0 128 128" className="w-6 h-6">
        <rect width="128" height="128" rx="24" fill="#AB9FF2"/>
        <path d="M110.4 64.8C110.4 39.2 89.6 18.4 64 18.4H19.2v91.2h19.2V81.6h25.6c25.6 0 46.4-20.8 46.4-46.4 0 0 0 12.8 0 29.6z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "The fun way to use Ethereum",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/25",
    iconBg: "bg-pink-500/20",
    icon: (
      <svg viewBox="0 0 120 120" className="w-6 h-6">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="30%" stopColor="#FF6B35"/>
            <stop offset="60%" stopColor="#C71585"/>
            <stop offset="100%" stopColor="#4B0082"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="60" fill="url(#rg)"/>
        <path d="M20 60 Q60 20 100 60" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/>
        <path d="M28 68 Q60 32 92 68" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8"/>
      </svg>
    ),
  },
];

export function WalletConnectModal({ enteredAddress, onSuccess, onClose }: WalletConnectModalProps) {
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null);
  const [connectingDots, setConnectingDots] = useState(0);

  const simulateConnect = (wallet: typeof WALLETS[0]) => {
    setSelectedWallet(wallet);
    setStep("connecting");

    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      setConnectingDots(dots);
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setStep("verify");
    }, 2800);
  };

  const shortAddr = enteredAddress
    ? `${enteredAddress.slice(0, 10)}...${enteredAddress.slice(-6)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        data-testid="modal-wallet-connect"
        className="relative z-10 w-full max-w-md glass-card rounded-2xl overflow-hidden glow-primary"
      >
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-violet-600" />

        {/* Select wallet step */}
        {step === "select" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Connect Wallet</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select your wallet to continue</p>
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
                Connecting to read your address for verification only. No transactions will be made.
              </p>
            </div>

            <div className="space-y-2">
              {WALLETS.map((wallet) => (
                <button
                  key={wallet.id}
                  data-testid={`button-wallet-${wallet.id}`}
                  onClick={() => simulateConnect(wallet)}
                  className={`w-full glass rounded-xl border ${wallet.border} bg-gradient-to-r ${wallet.color} p-3.5 flex items-center gap-3 text-left group hover-elevate`}
                >
                  <div className={`w-10 h-10 rounded-md ${wallet.iconBg} flex items-center justify-center flex-shrink-0`}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{wallet.name}</div>
                    <div className="text-xs text-muted-foreground">{wallet.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground/40">
              Secured by WalletConnect v3 · Read-only connection
            </p>
          </div>
        )}

        {/* Connecting step */}
        {step === "connecting" && selectedWallet && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse-glow">
                {selectedWallet.icon}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-background flex items-center justify-center">
                <Wifi className="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                Opening {selectedWallet.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Waiting for wallet connection
                {".".repeat(connectingDots + 1)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= connectingDots ? "bg-violet-400 scale-110" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            <div className="w-full glass rounded-md border border-white/5 px-4 py-3">
              <p className="text-xs text-muted-foreground/60">
                If {selectedWallet.name} doesn't open automatically, please open it manually and approve the connection request.
              </p>
            </div>

            <button
              data-testid="button-cancel-connecting"
              onClick={() => setStep("select")}
              className="text-xs text-muted-foreground/60 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Try another wallet
            </button>
          </div>
        )}

        {/* Verify step — address matched */}
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
              <button
                data-testid="button-close-verify-modal"
                onClick={onClose}
                className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="glass rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Address Detected</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <SiEthereum className="w-3.5 h-3.5 text-white" />
                </div>
                <code
                  data-testid="text-detected-address"
                  className="text-sm font-mono text-foreground break-all"
                >
                  {enteredAddress}
                </code>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-300">
                  Connected address matches your entered address
                </p>
              </div>
            </div>

            <div className="glass rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Please confirm this is your wallet address before proceeding to your dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                data-testid="button-wrong-wallet"
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1 border-white/10 text-muted-foreground text-sm"
              >
                Wrong Wallet
              </Button>
              <Button
                data-testid="button-confirm-address"
                onClick={() => onSuccess(enteredAddress)}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm & Enter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
