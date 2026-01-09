'use client'

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthFormLayout from "@/components/auth/AuthFormLayout";
import AuthFormHeader from "@/components/auth/AuthFormHeader";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/auth/ErrorMessage";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Auth state change will be handled by the Navbar's onAuthStateChange listener
    router.push(redirect);
    router.refresh();
  };

  return (
    <AuthFormLayout>
      <AuthFormHeader
        title="Sign in to your account"
        subtitle="Or"
        linkText="create a new account"
        linkHref="/auth/signup"
      />

      <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
        <ErrorMessage message={error} />

        <div className="space-y-4">
          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <PasswordInput
            label="Password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthFormLayout>
  );
}
