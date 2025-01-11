import { format } from 'date-fns';
import { AdminOrder } from '@/src/types';
import { PriceDisplay } from '../../UI/PriceDisplay';
import Image from 'next/image';
import { Package } from 'lucide-react';


interface OrderInformationProps {
    order: AdminOrder;
}


export default function OrderInformation({ order }: OrderInformationProps) { 
    const total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );


    // Helper function to get complete image URL
    const getImageUrl = (
      imageUrl: string | null | undefined
    ): string | null => {
      if (!imageUrl) return null;

      // If URL contains cloudinary path multiple times, extract the last valid cloudinary URL
      if (imageUrl.includes("cloudinary.com")) {
        // Find the last occurrence of 'https://res.cloudinary.com'
        const cloudinaryStart = imageUrl.lastIndexOf(
          "https://res.cloudinary.com"
        );
        if (cloudinaryStart !== -1) {
          return imageUrl.slice(cloudinaryStart);
        }
      }

      // If it's a relative path, append base URL
      if (imageUrl.startsWith("/")) {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        return `${baseUrl}${imageUrl}`;
      }

      return null;
    };

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Order Information
          </h2>
        </div>
        <div className="p-6">
          {/* Order Details Grid */}
          <dl className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <dt className="text-sm font-medium text-gray-500">Order Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(order.created_at), "PPPp")}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(order.updated_at), "PPPp")}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Payment Status
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                    order.payment_status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.payment_status ? "Paid" : "Unpaid"}
                </span>
              </dd>
            </div>

            {order.tracking_number && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Tracking Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.tracking_number}
                </dd>
              </div>
            )}
          </dl>

          {/* Order Items */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Order Items
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {(() => {
                              const imageUrl = getImageUrl(item.product_image);

                              if (!imageUrl) {
                                return (
                                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                );
                              }

                              return (
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                                  <Image
                                    src={imageUrl}
                                    alt={item.product_name}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{ objectFit: "cover" }}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <PriceDisplay
                          amount={item.price}
                          sourceCurrency="USD"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <PriceDisplay
                          amount={item.price * item.quantity}
                          sourceCurrency="USD"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <dl className="space-y-2">
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">
                    <PriceDisplay amount={total} sourceCurrency="USD" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
}