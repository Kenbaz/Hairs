'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/libs/_redux/hooks';
import { selectAuth } from '@/src/libs/_redux/authSlice';

interface GuardProps {
    children: React.ReactNode;
}

// Route guard for authenticated routes
export function AuthGuard({ children }: GuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector(selectAuth);

  useEffect(() => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      const loginUrl = new URL("/auth/login", window.location.origin);
      loginUrl.searchParams.set("from", currentPath);
      router.push(loginUrl.toString());
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  
  return <>{children}</>;
}


// Guard for guest-only routes (login, register)
export function GuestGuard({ children }: GuardProps) { 
    const router = useRouter();
    const { isAuthenticated } = useAppSelector(selectAuth);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    return <>{children}</>;
};


// Guard for verified email routes
export function VerifiedEmailGuard({ children }: GuardProps) { 
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector(selectAuth);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (!user?.verified_email) {
            router.push('/verify-email/verify-email-notice');
            return;
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || !user?.verified_email) return null;

    return <>{children}</>;
};


// Guard for registration flow
export function RegistrationFlowGuard({ children }: GuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector(selectAuth);

  useEffect(() => {
    if (isAuthenticated && user?.verified_email && !user?.address) {
      router.push('/auth/shipping-address');
      return;
    }

    if (isAuthenticated && user?.verified_email && user?.address) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user?.verified_email) return null;
  
  return <>{children}</>;
}
