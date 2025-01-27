import UserLoginForm from "@/app/_components/_authForms/UserLoginForm";

export default function LoginPage() {
    return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                <p className="text-gray-600">Please log in to continue shopping</p>
                <UserLoginForm />
            </div>
    );
}