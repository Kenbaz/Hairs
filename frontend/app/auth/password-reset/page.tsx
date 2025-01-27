import { PasswordResetForm } from "@/app/_components/_authForms/PasswordResetForm";
import { PublicAuthLayout } from "@/app/_components/_authForms/publicForms/PublicAuthLayout";


export default function PasswordResetPage() {
    return (
        <PublicAuthLayout>
            <PasswordResetForm/>
        </PublicAuthLayout>
    )
}