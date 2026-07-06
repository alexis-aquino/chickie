import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { KeyRound } from "lucide-react";

export function ResetPasswordCard() {
  const { completePasswordReset } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const err = await completePasswordReset(password);
      if (err) setError(err);
      else setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-yellow-500 py-16 px-4">
      <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-black/5">
        <div className="px-7 pt-7 pb-4 flex flex-col items-center gap-2">
          <img src={logo} alt="Chickie" className="size-14 rounded-full object-cover ring-2 ring-brand-accent-light shadow" />
          <h2 className="text-xl font-semibold mt-1">Set a new password</h2>
          <p className="text-sm text-muted-foreground text-center">
            {done ? "Your password has been updated." : "Choose a new password for your account."}
          </p>
        </div>

        <div className="px-7 pb-7 flex flex-col gap-4">
          {done ? (
            <Button asChild className="w-full h-11 bg-red-600 hover:bg-red-700 text-white">
              <a href="/">Continue to sign in</a>
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reset-pw">New Password</Label>
                <Input
                  id="reset-pw"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reset-confirm">Confirm New Password</Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white gap-2 mt-1">
                <KeyRound className="size-4" aria-hidden="true" />
                {submitting ? "Saving…" : "Save New Password"}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
