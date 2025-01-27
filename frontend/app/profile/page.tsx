import { ProfileDetails } from "../_components/userProfileUI/ProfileDetails";
import { AuthGuard } from "../_components/guards/RouteGuards";

export default function ProfilePage() {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <ProfileDetails />
        </div>
      </AuthGuard>
    );
}