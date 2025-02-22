import CartPage from "@/app/_components/pages/CartPage";
import { AuthGuard } from "../../_components/guards/RouteGuards";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart - Miz Viv Hairs",
  description: "Review and manage shopping cart items",
};


export default function Cart() { 
    return (
        <AuthGuard>
            <div className="space-y-6">
                <CartPage/>
            </div>
        </AuthGuard>
    )
}