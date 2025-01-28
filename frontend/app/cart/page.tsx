import { Cart } from "../_components/cartUI/Cart";
import { AuthGuard } from "../_components/guards/RouteGuards";


export default function CartPage() { 
    return (
        <AuthGuard>
            <div className="space-y-6">
                <Cart />
            </div>
        </AuthGuard>
    )
}