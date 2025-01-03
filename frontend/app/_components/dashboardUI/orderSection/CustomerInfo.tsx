import Link from 'next/link';
import { Mail, MapPin, ExternalLink } from 'lucide-react';


interface CustomerInfoProps { 
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
}


export default function CustomerInfo({
    customerName,
    customerEmail,
    shippingAddress
}: CustomerInfoProps) { 
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Customer Information
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Customer Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Customer Name
              </h3>
              <p className="mt-1 text-sm text-gray-900">{customerName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <div className="mt-1 flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${customerEmail}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {customerEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Shipping Address
            </h3>
            <div className="mt-1 flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <p className="text-sm text-gray-900 whitespace-pre-line">
                {shippingAddress}
              </p>
            </div>
          </div>

          {/* View Customer Link */}
          <div className="pt-3 border-t border-gray-200">
            <Link
              href={`/admin/customers?email=${encodeURIComponent(
                customerEmail
              )}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Customer Details
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shippingAddress);
                  // You might want to show a toast notification here
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Copy Shipping Address
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${customerEmail}`;
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Send Email to Customer
              </button>
              <Link
                href={`/admin/orders?customer=${encodeURIComponent(
                  customerEmail
                )}`}
                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
}