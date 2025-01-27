'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Alert } from '../UI/Alert';
import { PasswordManager } from '@/src/libs/auth/passwordManager';


interface PasswordResetConfirmationProps {
    token: string;
}


export function PasswordResetConfirmation({ token }: PasswordResetConfirmationProps) {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    
    // Basic password validation
    const validatePassword = () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (password !== passwordConfirmation) {
            setError('Password do not match');
            return false;
        }
        return true;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validatePassword()) return;

        setIsLoading(true);
        try {
          const success = await PasswordManager.confirmReset({
            token,
            password,
            password_confirmation: passwordConfirmation,
          });

          if (success) {
            // Check for admin route
            const isAdminRoute = window.location.pathname.startsWith('/admin');
            router.push(isAdminRoute ? "/admin/login" : "/auth/login");
          }
        } catch {
          setError("Failed to reset password. The link may have expired.");
        } finally {
          setIsLoading(false);
        }
    };


    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Reset Password
          </Button>
        </form>
      </div>
    );
}