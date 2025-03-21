'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/src/libs/_redux/hooks';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Alert } from '../UI/Alert';
import Link from 'next/link';
import { LoginCredentials } from '@/src/types';
import { login } from '@/src/libs/_redux/authSlice';


export default function UserLoginForm() { 
    const [error, setError] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const router = useRouter();


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<LoginCredentials>();


    const onSubmit = async (data: LoginCredentials) => {
        try {
            setError(null);
            await dispatch(login(data)).unwrap();

            // Redirect to home page if authentication was successful
            router.push('/');
        } catch {
            setError('Login failed. Please check your credentials.');
        }
    };


    return (
      <div className="w-full max-w-md space-y-8 pb-10">
        <div className="text-center">
          <h2 className="text-2xl text-gray-900 font-bold">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue shopping
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
            disabled={isSubmitting}
          />

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
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between">
            <Link
              href="/auth/register"
              className="text-sm text-gray-800 hover:text-gray-900"
            >
              Create an account
            </Link>
            <Link
              href="/auth/password-reset"
              className="text-sm text-gray-800 hover:text-gray-900"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            variant='default'
            type="submit"
            className="w-full bg-customBlack text-white"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign in
          </Button>
        </form>
      </div>
    );
    
}