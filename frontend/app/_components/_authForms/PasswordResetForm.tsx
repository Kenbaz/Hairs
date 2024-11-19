'use client';

import { useState } from "react";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Alert } from "../UI/Alert";
import { PasswordManager } from "@/src/libs/auth/passwordManager";
import Link from "next/link";


export function PasswordResetForm() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await PasswordManager.requestReset({ email });
        if (result) {
            setSuccess(true);
        }

        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="space-y-6">
                <Alert
                    type="success"
                    message="Password reset instructions have been sent to your email"
                />
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = '/admin/login'}
                >
                    Return to Login
                </Button>
            </div>
        );
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Reset password
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
}