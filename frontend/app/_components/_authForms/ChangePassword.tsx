import { useState } from "react";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Alert } from "../UI/Alert";
import { PasswordManager } from "@/src/libs/auth/passwordManager";


export function ChangePassword() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);


    const validatePassword = () => {
        if (newPassword.length < 8) {
            setError('New password must be at lease 8 characters long')
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError('New password do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!validatePassword()) return;

        setIsLoading(true);
        const success = await PasswordManager.changePassword({
            old_password: oldPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword,
        });

        if (success) {
            setSuccess(true);
            // Reset form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsLoading(false);
    };


    return (
       <div className="bg-white p-6 rounded-lg shadow">
         <h2 className="text-xl font-semibold mb-4">Change Password</h2>

         {error && <Alert type="error" message={error} className="mb-4" />}
         {success && (
           <Alert
             type="success"
             message="Password changed successfully"
             className="mb-4"
           />
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
           <Input
             type="password"
             label="Current Password"
             value={oldPassword}
             onChange={(e) => setOldPassword(e.target.value)}
             required
             disabled={isLoading}
           />

           <Input
             type="password"
             label="New Password"
             value={newPassword}
             onChange={(e) => setNewPassword(e.target.value)}
             required
             disabled={isLoading}
           />

           <Input
             type="password"
             label="Confirm New Password"
             value={confirmPassword}
             onChange={(e) => setConfirmPassword(e.target.value)}
             required
             disabled={isLoading}
           />

           <Button
             type="submit"
             className="mt-2"
             isLoading={isLoading}
             disabled={isLoading}
           >
             Change Password
           </Button>
         </form>
       </div>
    );
}