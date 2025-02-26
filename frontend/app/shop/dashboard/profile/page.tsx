import UserProfilePage from "@/app/_components/userProfileUI/UserProfile";
import { AuthGuard } from "@/app/_components/guards/RouteGuards";

export default function ProfilePage() {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <UserProfilePage/>
        </div>
      </AuthGuard>
    );
}