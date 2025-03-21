import { VerifiedEmailGuard } from "@/app/_components/guards/RouteGuards";
import ShippingAddressForm from "@/app/_components/userRegistration/ShippingAddressForm";
import { PublicAuthLayout } from "@/app/_components/_authForms/publicForms/PublicAuthLayout";

export default function ShippingAddressPage() {
    return (
      <VerifiedEmailGuard>
        <PublicAuthLayout>
          <ShippingAddressForm />
        </PublicAuthLayout>
      </VerifiedEmailGuard>
    );
}