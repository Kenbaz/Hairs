import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Shopping Cart - Miz Viv Hairs',
    description: 'Review and manage shopping cart items',
};

export default function CartLayout({
    children,
}: {
        children: React.ReactNode;
}) {
    return (
        <main className="flex-1 py-8">
            <div className="mx-auto max-w-7xl">
                {children}
            </div>
        </main>
    )
};