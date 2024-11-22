'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/libs/_redux/hooks';
import {
    selectNotifications,
    selectUnreadCount,
    selectIsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
} from '@/src/libs/_redux/notificationSlice';
import { AdminNotification } from '@/src/libs/_redux/types';
import { Bell, CheckCheck, ShoppingBag, User, Package } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = {
    order: ShoppingBag,
    inventory: Package,
    user: User,
    system: Bell,
} as const;

function NotificationItem({ notification }: { notification: AdminNotification }) {
    const dispatch = useAppDispatch();
    const Icon = NotificationIcon[notification.type];

    const handleClick = () => {
        if (!notification.is_read) {
            dispatch(markAsRead(notification.id));
        }
    };

    return (
        <div
            className={`
                p-4 hover:bg-gray-50 transition-colors duration-150
                ${notification.is_read ? "opacity-75" : "bg-blue-50"}
                border-b border-gray-100 last:border-0
            `}
        >
            <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${notification.is_read ? "bg-gray-100" : "bg-blue-100"}`}>
                    <Icon className={`h-5 w-5 ${notification.is_read ? "text-gray-600" : "text-blue-600"}`} />
                </div>

                <div className="flex-1 min-w-0">
                    {notification.link ? (
                        <Link href={notification.link} className="block" onClick={handleClick}>
                            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                        </Link>
                    ) : (
                        <div onClick={handleClick}>
                            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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
    const dispatch = useAppDispatch();

    // Fetch notifications on mount
    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
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
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Notifications</h2>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
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
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <Link
                            href="/admin/notifications"
                            className="block text-center text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}