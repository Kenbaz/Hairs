import EmailVerification from "@/app/_components/userRegistration/EmailVerificationNotice";
import { RegistrationFlowGuard } from "@/app/_components/guards/RouteGuards";

export default function VerifyEmailNoticePage() {
    return (
        <RegistrationFlowGuard>
            <EmailVerification />
        </RegistrationFlowGuard>
    )
}