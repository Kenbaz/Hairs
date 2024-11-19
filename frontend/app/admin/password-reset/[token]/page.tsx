'use client';

import { useEffect, useState } from 'react';
import { PasswordResetConfirmation } from '@/app/_components/_authForms/PasswordResetConfirmationForm';
import { AuthLayout } from '@/app/_components/_authForms/AuthLayout';
import { Alert } from '@/app/_components/UI/Alert';
import { Button } from '@/app/_components/UI/Button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';


interface PasswordResetConfirmProps {
    params: {
        token: string;
    };
}


export default function PasswordResetConfirmPage({ params }: PasswordResetConfirmProps) {
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const { token } = params;

    useEffect(() => {
        // Basic token validation, (checking for JWT structure)
        const validateToken = () => {
            if (!token) return false;
            // Check if it has 3 parts separated by dots (header.payload.signature)
            const parts = token.split('.');
            return parts.length === 3;
        };

        setIsValidToken(validateToken());
    }, [token]);

    if (isValidToken === null) {
        // Loading state 
        return (
            <AuthLayout>
                <div className='flex justify-center, items-center'>
                    <Loader2 className='animate-spin' />
                </div>
            </AuthLayout>
        );
    };

    if (!isValidToken) {
        return (
          <AuthLayout>
            <div className="space-y-6">
              <Alert
                type="error"
                message="Invalid or expired password reset link."
              />
              <div className="text-center">
                <Link href="/admin/password-reset">
                  <Button variant="outline">Request New Reset Link</Button>
                </Link>
              </div>
            </div>
          </AuthLayout>
        );
    };

    return (
        <AuthLayout>
            <PasswordResetConfirmation token={ token } />
        </AuthLayout>
    )
}