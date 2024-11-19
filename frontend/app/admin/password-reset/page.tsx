import { PasswordResetForm } from "@/app/_components/_authForms/PasswordResetForm";
import { AuthLayout } from "@/app/_components/_authForms/AuthLayout";


export default function PasswordResetPage() {
    return (
        <AuthLayout>
            <PasswordResetForm/>
        </AuthLayout>
    )
}