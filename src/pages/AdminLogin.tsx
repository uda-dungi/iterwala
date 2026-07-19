import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { isAdminEmail } from "@/config/site";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { signIn, signInWithGoogle, configured } = useAuth();
  const nav = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const trimmed = email.trim();
    if (!isAdminEmail(trimmed)) {
      toast.error("This email is not authorized for admin access.");
      setBusy(false);
      return;
    }

    const { error } = await signIn(trimmed, password);
    if (error) toast.error(error);
    else {
      toast.success("Welcome back");
      nav("/admin/orders");
    }
    setBusy(false);
  };

  const submitGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    const { error } = await signInWithGoogle(`${window.location.origin}/admin/orders`);
    if (error) {
      toast.error(error);
      setGoogleBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="luxury-card p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Restricted Access</p>
          <h1 className="font-display text-3xl text-ivory mt-2">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Purchase data and store management — separate from the public website.
          </p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-sm border border-primary/40 bg-primary/10 p-3 text-xs text-ivory/90">
            Auth backend not connected. Add Supabase keys to your <span className="text-primary">.env</span> file.
          </div>
        )}

        <button
          type="button"
          onClick={submitGoogle}
          disabled={googleBusy}
          className="w-full flex items-center justify-center gap-3 border border-border rounded-sm py-3 text-sm font-medium text-ivory bg-background/40 hover:border-primary/50 hover:bg-background/70 transition-colors disabled:opacity-60"
        >
          {googleBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] tracking-luxe uppercase text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-luxe uppercase text-muted-foreground">Admin Email</Label>
            <Input
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@itrawala.in"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-luxe uppercase text-muted-foreground">Password</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="luxury" size="lg" className="w-full mt-2" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign In to Admin
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="text-primary hover:text-gold underline underline-offset-4">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
