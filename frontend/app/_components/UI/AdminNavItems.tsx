import { LayoutDashboard, Package, Tags, ShoppingBag, Users, BarChart3, DollarSign, Receipt, Heart, Settings, ChevronDown, Package2, Mail, CreditCard, ListIcon, BarChart2, Store, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';


interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
    return (
        <Link
            href={href}
            className={`
                flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
        >
            <span className='flex-shrink-0'>{icon}</span>
            <span>{label}</span>
        </Link>
    );
};


interface NavGroupProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}


function NavGroup({ title, children, icon }: NavGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();

    // Check if any child route is active to auto-expand the group
    const isActiveGroup = pathname.includes(title.toLowerCase());

    // Auto expand if group contains active route
    useState(() => {
        if (isActiveGroup) {
            setIsExpanded(true)
        }
    });
    
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
          w-full flex items-center justify-between
          px-4 py-3 rounded-lg
          text-sm font-medium
          transition-colors duration-200
          ${
            isActiveGroup
              ? "text-blue-700 bg-blue-50"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }
        `}
        >
          <div className="flex items-center space-x-2">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{title}</span>
          </div>
          <ChevronDown
            className={`
            h-4 w-4 transition-transform duration-700
            ${isExpanded ? "transform rotate-180" : ""}
          `}
          />
        </button>

        <div
          className={`
          overflow-hidden transition-all duration-700 ease-in-out
          ${
            isExpanded
              ? "max-h-96 opacity-100 transition-all duration-700 ease-in-out"
              : "max-h-0 opacity-0 transition-all duration-700 ease-in-out"
          }
        `}
        >
          <div className="pl-4 pt-1">{children}</div>
        </div>
      </div>
    );
};


export function DashboardNav() {
    const pathname = usePathname();

    return (
      <nav className="p-4 space-y-6">
        {/* Dashboard - Always visible */}
        <NavItem
          href="/admin/dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          isActive={pathname === "/admin/dashboard"}
        />

        {/* Product Management */}
        <NavGroup title="Products" icon={<Package className="h-5 w-5" />}>
          <NavItem
            href="/admin/products"
            icon={<Package className="h-5 w-5" />}
            label="All Products"
            isActive={pathname === "/admin/products"}
          />
          <NavItem
            href="/admin/products/categories"
            icon={<Tags className="h-5 w-5" />}
            label="Categories"
            isActive={pathname === "/admin/products/categories"}
          />
        </NavGroup>

        {/* Order Management */}
        <NavGroup title="Orders" icon={<ShoppingBag className="h-5 w-5" />}>
          <NavItem
            href="/admin/orders"
            icon={<ShoppingBag className="h-5 w-5" />}
            label="All Orders"
            isActive={pathname === "/admin/orders"}
          />
          <NavItem
            href="/admin/orders/returns"
            icon={<Receipt className="h-5 w-5" />}
            label="Returns"
            isActive={pathname === "/admin/orders/returns"}
          />
        </NavGroup>

        {/* Customer Management */}
        <NavGroup title="Customers" icon={<Users className="h-5 w-5" />}>
          <NavItem
            href="/admin/customers"
            icon={<Users className="h-5 w-5" />}
            label="All Customers"
            isActive={pathname === "/admin/customers"}
          />
          <NavItem
            href="/admin/support/emails"
            icon={<Mail className="h-5 w-5" />}
            label="Email Support"
            isActive={pathname === "/admin/support/emails"}
          />
          <NavItem
            href="/admin/wishlist"
            icon={<Heart className="h-5 w-5" />}
            label="Wishlists"
            isActive={pathname === "/admin/wishlist"}
          />
        </NavGroup>

        {/* Analytics & Reports */}
        <NavGroup title="Analytics" icon={<BarChart3 className="h-5 w-5" />}>
          <NavItem
            href="/admin/analytics/sales"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Sales Analytics"
            isActive={pathname === "/admin/analytics/sales"}
          />
          <NavItem
            href="/admin/analytics/revenue"
            icon={<DollarSign className="h-5 w-5" />}
            label="Revenue Report"
            isActive={pathname === "/admin/analytics/revenue"}
          />
          <NavItem
            href="/admin/analytics/refund"
            icon={<DollarSign className="h-5 w-5" />}
            label="Refund Report"
            isActive={pathname === "/admin/analytics/refund"}
          />
        </NavGroup>

        {/* Marketing */}
        <NavGroup title="Marketing" icon={<Store className="h-5 w-5" />}>
          <NavItem
            href="/admin/marketing/flash_sale"
            icon={<PackageOpen className="h-5 w-5" />}
            label="Flash Sales"
            isActive={pathname === "/admin/marketing/flash_sale"}
          />
        </NavGroup>

        {/* Payment Management */}
        <NavGroup title="Payments" icon={<DollarSign className="h-5 w-5" />}>
          <NavItem
            href="/admin/admin-payments"
            icon={<CreditCard className="h-5 w-5" />}
            label="All Payments"
            isActive={pathname === "/admin/admin-payments"}
          />
          <NavItem
            href="/admin/admin-payments/transactions"
            icon={<ListIcon className="h-5 w-5" />}
            label="Transaction Logs"
            isActive={pathname === "/admin/admin-payments/transactions"}
          />
          <NavItem
            href="/admin/admin-payments/payment-stats"
            icon={<BarChart2 className="h-5 w-5" />}
            label="Payment Stats"
            isActive={pathname === "/admin/admin-payments/payment-stats"}
          />
        </NavGroup>

        {/* Settings & configuration */}
        <NavGroup title="Settings" icon={<Settings className="h-5 w-5" />}>
          <NavItem
            href="/admin/currencies"
            icon={<DollarSign className="h-5 w-5" />}
            label="Currency Management"
            isActive={pathname === "/admin/currencies"}
          />
          <NavItem
            href="/admin/returns"
            icon={<Package2 className="h-5 w-5" />}
            label="Returns Policies"
            isActive={pathname === "/admin/returns"}
          />
        </NavGroup>
      </nav>
    );
}