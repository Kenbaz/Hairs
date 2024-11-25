'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/libs/_redux/hooks';
import {
    selectNotifications,
    selectUnreadCount,
    selectIsLoading,
    markAsRead,
    fetchNotifications,
} from '@/src/libs/_redux/notificationSlice';
import { AdminNotification } from '@/src/libs/_redux/types';
import { Bell, ShoppingBag, Package } from 'lucide-react';
// import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';


const NotificationIcon = {
    order: ShoppingBag,
    inventory: Package,
} as const;


interface NotificationItemProps {
    notification: AdminNotification;
    onNavigate: (notification: AdminNotification) => void;
}


function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
    const dispatch = useAppDispatch();

    // Type assertion to ensure we only get allowed notification types
    const allowedType = notification.type as keyof typeof NotificationIcon;
    const Icon = NotificationIcon[allowedType];

    const handleClick = () => {
        if (!notification.is_read) {
            dispatch(markAsRead(notification.id));
        }
        onNavigate(notification)
    };

     return (
       <div
         onClick={handleClick}
         className={`
                p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer
                ${notification.is_read ? "opacity-75" : "bg-blue-50"}
                border-b border-gray-100 last:border-0
            `}
       >
         <div className="flex items-start space-x-4">
           <div
             className={`p-2 rounded-full ${
               notification.is_read ? "bg-gray-100" : "bg-blue-100"
             }`}
           >
             {Icon && (
               <Icon
                 className={`h-5 w-5 ${
                   notification.is_read ? "text-gray-600" : "text-blue-600"
                 }`}
               />
             )}
           </div>

           <div className="flex-1 min-w-0">
             <p className="font-medium text-sm text-gray-900">
               {notification.title}
             </p>
             <p className="text-sm text-gray-500">{notification.message}</p>
             <p className="text-xs text-gray-400 mt-1">
               {formatDistanceToNow(new Date(notification.created_at), {
                 addSuffix: true,
               })}
             </p>
           </div>
         </div>
       </div>
     );
}


export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useAppSelector(selectNotifications);
    const unreadCount = useAppSelector(selectUnreadCount);
    const isLoading = useAppSelector(selectIsLoading);
    const router = useRouter();
    const dispatch = useAppDispatch();


    const handleNavigate = (notification: AdminNotification) => {
        setIsOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };


    // Fetch notifications on mount
    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);


    const handleManualRefresh = () => {
        dispatch(fetchNotifications())
    };
    

   return (
     <div className="relative">
       <button
         onClick={() => setIsOpen(!isOpen)}
         className="p-2 rounded-full hover:bg-gray-100 relative"
       >
         <Bell className="h-5 w-5" />
         {unreadCount > 0 && (
           <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs text-white bg-red-500 rounded-full transform -translate-y-1/2 translate-x-1/2">
             {unreadCount}
           </span>
         )}
       </button>

       {isOpen && (
         <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
           <div className="p-4 border-b border-gray-200 flex items-center justify-between">
             <h2 className="text-lg font-semibold">Notifications</h2>
             <button
               onClick={handleManualRefresh}
               className="p-2 hover:bg-gray-100 rounded-full"
               title="Refresh notifications"
             >
               <svg
                 className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                 />
               </svg>
             </button>
           </div>

           <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
             {isLoading ? (
               <div className="p-4 text-center">
                 <span className="loading loading-spinner"></span>
               </div>
             ) : notifications.length === 0 ? (
               <div className="p-4 text-center text-gray-500">
                 No notifications
               </div>
             ) : (
               notifications.map((notification) => (
                 <NotificationItem
                   key={notification.id}
                   notification={notification}
                   onNavigate={handleNavigate}
                 />
               ))
             )}
           </div>
         </div>
       )}
     </div>
   );
}