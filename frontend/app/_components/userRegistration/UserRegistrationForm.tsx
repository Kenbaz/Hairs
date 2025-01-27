'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Alert } from '../UI/Alert';
import Link from 'next/link';
import { userAuthService } from '@/src/libs/services/customerServices/userAuthService';
import { UserRegisterData } from '@/src/types';


export default function RegistrationForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<{
            type: 'success' | 'error';
            message: string;
    } | null>(null);
    const router = useRouter();


    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<UserRegisterData>();


    const password = watch('password');


    const onSubmit = async (data: UserRegisterData) => {
        try {
            setIsLoading(true);
            setAlert(null);

            await userAuthService.registerUser(data);

            setAlert({
                type: 'success',
                message: 'Registration successful. Please check your email to verify your account.'
            });
            router.push('/verify-email/verify-email-notice');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
            setAlert({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };


    return (
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {alert && (
                  <Alert type={alert.type} message={alert.message} className="mb-4" />
                )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Account Information</h3>
            <Input
              label="Email Address"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                {...register("first_name", {
                  required: "First name is required",
                })}
                error={errors.first_name?.message}
                disabled={isLoading}
              />

              <Input
                label="Last Name"
                {...register("last_name", {
                  required: "Last name is required",
                })}
                error={errors.last_name?.message}
                disabled={isLoading}
              />
            </div>

            <Input
              label="Phone Number"
              type="tel"
              {...register("phone_number", {
                pattern: {
                  value:
                    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                  message: "Invalid phone number",
                },
              })}
              error={errors.phone_number?.message}
              disabled={isLoading}
            />
          </div>

          {/* Password Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Set Password</h3>
            <Input
              label="Password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              error={errors.password?.message}
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register("password_repeat", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
              error={errors.password_repeat?.message}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-8"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </form>
      </div>
    );
}