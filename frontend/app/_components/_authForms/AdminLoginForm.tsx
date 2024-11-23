'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/libs/_redux/hooks";
import { login, selectAuth, clearError } from "@/src/libs/_redux/authSlice";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Alert } from "../UI/Alert";
import Link from "next/link";


export function AdminLoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { isLoading, error } = useAppSelector(selectAuth);


    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch(clearError());

        try {
          const result = await dispatch(login({ email, password })).unwrap();

          // Check if user is admin or staff
            if (result.user.is_staff || result.user.is_superuser) {
              console.log('Redirecting to dashboard')
                router.push('/admin/dashboard');
            } else {
               // For non-admin users, login will succeed but we need to redirect them away
                dispatch(login.rejected(
                    {
                        name: 'AccessDenied',
                        message: 'Access denied. Admin privileges required.'
                    },
                    'login/rejected',
                    { email, password }
                ));
            }
        } catch {
          
            // console.error('Login failed', err);
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
            href="/admin/password-reset"
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
