import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/types/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/logo.png";
import { GoogleIcon } from "./GoogleIcon";
import { Crown, UserCog, Eye, EyeOff, ArrowRight, MailCheck } from "lucide-react";

type AuthMode = "signin" | "signup";

export function AuthCard() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<Role>("owner");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [seedDemo, setSeedDemo] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const reset = () => {
    setError(null);
    setName("");
    setBusinessName("");
    setEmail("");
    setPw("");
    setConfirm("");
  };
  const switchMode = (m: AuthMode) => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!businessName.trim()) {
        setError("Please enter your business name.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        const { error: signupError, needsEmailConfirmation } = await signUp({
          name: name.trim(),
          businessName: businessName.trim(),
          email,
          password,
          role,
          seedDemo,
        });
        if (signupError) setError(signupError);
        else if (needsEmailConfirmation) setAwaitingConfirmation(true);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const err = await signIn(email, password);
        if (err) setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const err = await signInWithGoogle();
    if (err) setError(err);
    setGoogleLoading(false);
  };

  if (awaitingConfirmation) {
    return (
      <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-black/5">
        <div className="px-7 py-10 flex flex-col items-center gap-3 text-center">
          <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center">
            <MailCheck className="size-7 text-brand" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to
            activate your account, then come back and sign in.
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setAwaitingConfirmation(false);
              switchMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-black/5">
      <div className="px-7 pt-7 pb-4 flex flex-col items-center gap-2">
        <img src={logo} alt="Chickie" className="size-14 rounded-full object-cover ring-2 ring-brand-accent-light shadow" />
        <h2 className="text-xl font-semibold mt-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {mode === "signin" ? "Sign in to your Chickie dashboard." : "Join Chickie and start managing your supply chain."}
        </p>
      </div>

      <div className="px-7 pb-7 flex flex-col gap-4">
        {mode === "signup" && (
          <div className="flex rounded-xl overflow-hidden border" role="radiogroup" aria-label="Account role">
            {(["owner", "staff"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => {
                  setRole(r);
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                  role === r ? "bg-brand text-white" : "bg-white text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {r === "owner" ? <Crown className="size-3.5" aria-hidden="true" /> : <UserCog className="size-3.5" aria-hidden="true" />}
                {r === "owner" ? "Owner" : "Staff"}
              </button>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-3 h-11 text-sm font-medium"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <span
              className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-brand animate-spin"
              aria-hidden="true"
            />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">or with email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          {mode === "signup" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-name">Full Name</Label>
                <Input
                  id="auth-name"
                  placeholder="Maria Santos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-business">Business Name</Label>
                <Input
                  id="auth-business"
                  placeholder="Chickie — Quezon City Branch"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  autoComplete="organization"
                  required
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder={`${role}@chickie.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-pw">Password</Label>
              {mode === "signin" && (
                <button type="button" className="text-xs text-brand hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="auth-pw"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPw(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-confirm">Confirm Password</Label>
                <Input
                  id="auth-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-destructive" role="alert">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedDemo}
                  onChange={(e) => setSeedDemo(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-input accent-red-600"
                />
                <span className="text-muted-foreground">
                  Populate with sample inventory, suppliers, and customers so I can explore right away.{" "}
                  <span className="text-xs">(Leave unchecked to start from a clean slate.)</span>
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 bg-brand hover:bg-brand-dark text-white gap-2 mt-1">
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              {"Don't have an account? "}
              <button onClick={() => switchMode("signup")} className="text-brand font-medium hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              {"Already have an account? "}
              <button onClick={() => switchMode("signin")} className="text-brand font-medium hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
          By continuing you agree to Chickie&apos;s{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </Card>
  );
}
