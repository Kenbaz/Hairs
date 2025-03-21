'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/src/libs/_redux/hooks';
import { verificationSuccess } from '@/src/libs/_redux/authSlice';
import { userAuthService } from '@/src/libs/services/customerServices/userAuthService';
import { Button } from '@/app/_components/UI/Button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';


interface VerifyEmailProps {
    token: string;
}


export default function VerifyEmail({ token }: VerifyEmailProps) { 
    const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const dispatch = useAppDispatch();


    useEffect(() => {
        const verifyEmail = async () => {
            try {
              const response = await userAuthService.verifyEmail({ token: token });
              // Update auth state
              dispatch(
                verificationSuccess({
                  user: response.user,
                  tokens: response.tokens,
                })
              );
              setVerificationState("success");
            } catch (err) {
                setVerificationState('error');
                setError(err instanceof Error ? err.message : 'Verification failed.');
            }
        };

        verifyEmail();
    }, [token, dispatch]);


    const handleContinue = () => {
      router.push("/auth/shipping-address");
    };

    const handleRetry = () => {
       router.push("/verify-email/verify-email-notice");
    };


    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          {verificationState === "loading" && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 text-gray-900 animate-spin mx-auto" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {verificationState === "success" && (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully verified. You can now add your
                shipping address.
              </p>
              <div className="mt-6">
                <Button onClick={handleContinue} className="w-full">
                  Continue to Shipping Address
                </Button>
              </div>
            </div>
          )}

          {verificationState === "error" && (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error || "Unable to verify your email address."}
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-customBlack text-white"
                  variant="default"
                >
                  Request New Verification Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}