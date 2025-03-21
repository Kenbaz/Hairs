import { GuestGuard } from "../../_components/guards/RouteGuards";
import RegistrationForm from "../../_components/userRegistration/UserRegistrationForm";
import { PublicAuthLayout } from "@/app/_components/_authForms/publicForms/PublicAuthLayout";

export default function RegisterPage() { 
    return (
      <GuestGuard>
        <div className="h-screen overflow-y-auto">
          <PublicAuthLayout>
            <RegistrationForm />
          </PublicAuthLayout>
        </div>
      </GuestGuard>
    );
}