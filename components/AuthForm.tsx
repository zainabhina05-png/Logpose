"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { email, password }
        : { email, password, displayName };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        else toast(data.error ?? "Something went wrong", "error");
        return;
      }
      router.push("/dashboard");
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) {
        toast("Could not start guest session", "error");
        return;
      }
      const seedRes = await fetch("/api/demo-seed", { method: "POST" });
      if (seedRes.ok) {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="displayName" className="block text-sm text-parchment/80 mb-1">
              Display name
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-ocean-light border border-parchment/20 px-4 py-2 text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              required
            />
            {errors.displayName && (
              <p className="text-ember text-sm mt-1">{errors.displayName}</p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm text-parchment/80 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-ocean-light border border-parchment/20 px-4 py-2 text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            required
          />
          {errors.email && (
            <p className="text-ember text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-parchment/80 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-ocean-light border border-parchment/20 px-4 py-2 text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            required
            minLength={mode === "signup" ? 8 : 1}
          />
          {errors.password && (
            <p className="text-ember text-sm mt-1">{errors.password}</p>
          )}
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-parchment/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-ocean px-3 text-parchment/50">or</span>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={handleGuest}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        Continue as Guest
      </Button>

      <p className="text-center text-sm text-parchment/60">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-brass hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already sailing?{" "}
            <Link href="/login" className="text-brass hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
