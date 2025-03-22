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
      <div className="bg-white py-4">
        <h2 className="text-xl text-gray-900 font-semibold mb-4">
          Change Password
        </h2>

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
            className="text-gray-900 border"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            type="password"
            label="New Password"
            className="text-gray-900 border"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            type="password"
            label="Confirm New Password"
            className="text-gray-900 border"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            variant="default"
            type="submit"
            className="w-full mt-4 md:w-auto bg-customBlack hover:bg-gray-900 text-white"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Change Password
          </Button>
        </form>
      </div>
    );
}