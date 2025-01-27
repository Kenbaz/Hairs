import { use } from 'react';
import VerifyEmail from '@/app/_components/userRegistration/VerifyEmail';
// import { GuestGuard } from '@/app/_components/guards/RouteGuards';


interface PageProps {
  params: Promise<{
    token: string;
  }>;
}


export default function VerifyEmailPage({ params }: PageProps) { 
    const { token } = use(params);
    
  return (
        <VerifyEmail token={token} />
    )
}