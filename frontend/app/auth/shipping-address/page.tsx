import { VerifiedEmailGuard } from "@/app/_components/guards/RouteGuards";
import ShippingAddressForm from "@/app/_components/userRegistration/ShippingAddressForm";

export default function ShippingAddressPage() {
    return (
      <VerifiedEmailGuard>
        <ShippingAddressForm />
      </VerifiedEmailGuard>
    );
}