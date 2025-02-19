"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/libs/_redux/hooks";
import {
  adminLogin,
  selectAuth,
  clearError,
} from "@/src/libs/_redux/authSlice";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Alert } from "../UI/Alert";
import Link from "next/link";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, error } = useAppSelector(selectAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(adminLogin({ email, password })).unwrap();

      // Redirect if authentication was successful
      const redirect = searchParams.get("from") || "/admin/dashboard";
      router.push(redirect);
    } catch {
      // console.error("Admin login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      {error && <Alert type="error" message={error} />}

      <div>
        <Input
          type="email"
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/admin-auth/password-reset"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Sign in
      </Button>
    </form>
  );
}
