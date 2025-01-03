'use client';

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "../../UI/Button";


interface OrderStatusUpdateProps {
    currentStatus: string;
    onUpdateStatus: (status: string) => void;
    isLoading: boolean;
}


export default function OrderStatusUpdate({
    currentStatus,
    onUpdateStatus,
    isLoading,
}: OrderStatusUpdateProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);


    const ORDER_STATUSES = [
      {
        value: "pending",
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        value: "processing",
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
      },
      {
        value: "shipped",
        label: "Shipped",
        color: "bg-purple-100 text-purple-800",
      },
      {
        value: "delivered",
        label: "Delivered",
        color: "bg-green-100 text-green-800",
      },
      {
        value: "cancelled",
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
      },
    ];


    const handleStatusClick = (status: string) => {
        if (status === currentStatus) return;
        setSelectedStatus(status);
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        if (selectedStatus) {
            await onUpdateStatus(selectedStatus);
            setShowConfirm(false);
            setSelectedStatus(null);
        }
    };


     return (
       <div className="bg-white rounded-lg shadow">
         <div className="p-4 border-b border-gray-200">
           <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
         </div>
         <div className="p-4">
           {showConfirm ? (
             <div className="space-y-4">
               <p className="text-sm text-gray-600">
                 Are you sure you want to change the order status to{" "}
                 <span className="font-medium">
                   {
                     ORDER_STATUSES.find((s) => s.value === selectedStatus)
                       ?.label
                   }
                 </span>
                 ?
               </p>
               <div className="flex space-x-2">
                 <Button
                   onClick={handleConfirm}
                   isLoading={isLoading}
                   className="w-full"
                 >
                   <Check className="h-4 w-4 mr-2" />
                   Confirm
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => setShowConfirm(false)}
                   disabled={isLoading}
                   className="w-full"
                 >
                   <X className="h-4 w-4 mr-2" />
                   Cancel
                 </Button>
               </div>
             </div>
           ) : (
             <div className="space-y-2">
               {ORDER_STATUSES.map((status) => (
                 <button
                   key={status.value}
                   onClick={() => handleStatusClick(status.value)}
                   className={`w-full p-2 rounded-lg text-left ${
                     status.value === currentStatus
                       ? status.color
                       : "hover:bg-gray-50"
                   }`}
                 >
                   <span className="text-sm font-medium">{status.label}</span>
                 </button>
               ))}
             </div>
           )}
         </div>
       </div>
     );
}