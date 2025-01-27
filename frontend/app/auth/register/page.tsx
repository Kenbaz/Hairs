import { GuestGuard } from "../../_components/guards/RouteGuards";
import RegistrationForm from "../../_components/userRegistration/UserRegistrationForm";

export default function RegisterPage() { 
    return (
        <GuestGuard>
            <RegistrationForm />
        </GuestGuard>
    )
}