'use client';

import { useEffect, useState, use } from 'react';
import { PasswordResetConfirmation } from '@/app/_components/_authForms/PasswordResetConfirmationForm';
import { AuthLayout } from '@/app/_components/_authForms/AuthLayout';
import { Alert } from '@/app/_components/UI/Alert';
import { Button } from '@/app/_components/UI/Button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';


interface PasswordResetConfirmProps {
  params: Promise<{
    token: string;
  }>;
}

export default function PasswordResetConfirmPage({
  params,
}: PasswordResetConfirmProps) {
  // React.use to unwrap the params promise
  const { token } = use(params);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic validation - check if token exists and has the expected format
    const validateToken = () => {
      if (!token) return false;

      // Check if token contains uid-token format (should have at least one dash)
      const hasValidFormat = token.includes("-");
      return hasValidFormat;
    };

    setIsValidToken(validateToken());
  }, [token]);

  if (isValidToken === null) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin" />
        </div>
      </AuthLayout>
    );
  }

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
  }

  return (
    <AuthLayout>
      <PasswordResetConfirmation token={token} />
    </AuthLayout>
  );
}