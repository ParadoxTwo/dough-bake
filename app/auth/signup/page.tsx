'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthFormLayout from "@/components/auth/AuthFormLayout";
import AuthFormHeader from "@/components/auth/AuthFormHeader";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/auth/ErrorMessage";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Success - redirect to home
    alert("Account created successfully! You can now sign in.");
    router.push("/");
    router.refresh();
  };

  return (
    <AuthFormLayout>
      <AuthFormHeader
        title="Create your account"
        subtitle="Already have an account?"
        linkText="Sign in"
        linkHref="/auth/signin"
      />

      <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <PasswordInput
            label="Confirm Password"
            id="confirm-password"
            name="confirm-password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </Button>

        <p 
          className="text-xs text-center"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </AuthFormLayout>
  );
}
