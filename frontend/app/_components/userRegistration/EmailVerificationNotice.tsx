'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectAuth } from "@/src/libs/_redux/authSlice";
import { Alert } from "../UI/Alert";
import { Button } from "../UI/Button";
import { userAuthService } from "@/src/libs/services/customerServices/userAuthService";
import { Mail } from "lucide-react";


export default function EmailVerification() {
    const [isResending, setIsResending] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [resendSuccess, setResendSuccess] = useState(false);
    const router = useRouter();
    const { user } = useAppSelector(selectAuth);


    // if user is already verified, redirect to home page
    if (user?.verified_email) {
        router.push("/");
        return null;
    };


    const handleResendEmail = async () => {
        try {
            setIsResending(true);
            setAlert(null);
            setResendSuccess(false);

            await userAuthService.sendVerificationEmail();
            setResendSuccess(true);
        } catch (err) {
            setAlert({ type: "error", message: "Failed to resend verification email. Please try again." });
            console.error('Failed to resend verification email:', err);
        } finally {
            setIsResending(false);
        }
    };


    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          {/* Icon */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>

            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Verify your email
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              We&apos;ve sent a verification email to{" "}
              <span className="font-medium text-gray-900">{user?.email}</span>
            </p>
          </div>

          {/* Status Messages */}
            {alert && <Alert type={alert.type} message={alert.message} />}

          {resendSuccess && (
            <Alert
              type="success"
              message="Verification email has been resent. Please check your inbox."
            />
          )}

          {/* Instructions */}
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-sm text-gray-700 space-y-4">
              <p>To complete your registration, please:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Once verified, you&apos;ll be able to complete your profile</li>
              </ol>
              <p className="text-sm text-gray-500">
                If you don&apos;t see the email, please check your spam folder.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              isLoading={isResending}
              disabled={isResending}
              variant="default"
              className="w-full bg-customBlack text-white"
            >
              Resend verification email
            </Button>
          </div>
        </div>
      </div>
    );
}