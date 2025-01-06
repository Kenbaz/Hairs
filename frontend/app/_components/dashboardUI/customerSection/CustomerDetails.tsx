import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService } from "@/src/libs/services/adminServices/adminUserService";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { PriceDisplay } from "../../UI/PriceDisplay";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminUser, PurchaseHistory } from "@/src/types";


interface CustomerDetailsProps { 
    customerId: number;
}


export default function CustomerDetails({ customerId }: CustomerDetailsProps) { 
    const router = useRouter();
    const queryClient = useQueryClient();


    // Fetch customer details
    const { data: customer, isLoading, error } = useQuery<AdminUser>({
        queryKey: ['customer', customerId],
        queryFn: () => adminUserService.getUser(customerId),
    });


    // Fetch customer order history
    const { data: orderHistory } = useQuery<PurchaseHistory>({
        queryKey: ['customer-orders', customerId],
        queryFn: () => adminUserService.getPurchaseHistory(customerId)
    });


    // Toggle active status mutation
    const toggleActiveMutation = useMutation({
        mutationFn: () => adminUserService.toggleUserStatus(customerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
        },
    });

    if (isLoading) {
        return <div>Loading...</div>;
    };

    if (error || !customer) {
        return <Alert type="error" message="Failed to load customer details" />;
    };


    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>

        {/* Customer Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-500">
                    {customer.first_name[0]}{customer.last_name[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
              </div>
              <button
                onClick={() => toggleActiveMutation.mutate()}
                disabled={toggleActiveMutation.isPending}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  customer.is_active
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {customer.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {/* Customer Metrics */}
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-b">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {customer.total_orders}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                <PriceDisplay
                  amount={customer.total_spent}
                  sourceCurrency="USD"
                />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Order</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                <PriceDisplay
                  amount={customer.average_order_value}
                  sourceCurrency="USD"
                />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Customer Since
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {format(new Date(customer.date_joined), "MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Contact Information
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {customer.email}
                </a>
              </div>
              {customer.phone_number && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {customer.phone_number}
                  </p>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {customer.address}
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Joined{" "}
                  {format(new Date(customer.date_joined), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order History</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {orderHistory?.orders.length === 0 ? (
              <div className="px-6 py-4 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No orders yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This customer hasn&apos;t placed any orders yet.
                </p>
              </div>
            ) : (
              orderHistory?.orders.map((order) => (
                <div key={order.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Order #{order.id}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <PriceDisplay
                        amount={order.total_amount}
                        sourceCurrency="USD"
                      />
                      <span
                        className={`ml-2 inline-flex px-2 text-xs font-semibold rounded-full ${
                          order.payment_status
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.payment_status ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
}