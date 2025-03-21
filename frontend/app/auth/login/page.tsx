import UserLoginForm from "@/app/_components/_authForms/UserLoginForm";
import { PublicAuthLayout } from "@/app/_components/_authForms/publicForms/PublicAuthLayout";

export default function LoginPage() {
    return (
      <div className="h-screen overflow-y-auto">
        <PublicAuthLayout>
          <div className="flex flex-col items-center justify-center space-y-4">
            <UserLoginForm />
          </div>
        </PublicAuthLayout>
      </div>
    );
}