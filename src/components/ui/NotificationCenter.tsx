"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Check, Calendar, DollarSign, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'birthday' | 'reminder' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export default function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  className = ''
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-sky-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'birthday':
        return <UserPlus className="w-5 h-5 text-pink-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} no leídas)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-screen max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-40 overflow-hidden md:w-96">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({unreadCount} nuevas)
                  </span>
                )}
              </h3>
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 transition-all duration-200 ${
                        notification.read
                          ? 'bg-white dark:bg-slate-800'
                          : 'bg-sky-50 dark:bg-sky-900/20'
                      } hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-sky-500 rounded-full mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDistanceToNow(notification.timestamp, {
                                addSuffix: true,
                                locale: es
                              })}
                            </p>
                            {notification.actionLabel && (
                              <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
                                {notification.actionLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mark as read button */}
                        {!notification.read && onMarkAsRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(notification.id);
                            }}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            aria-label="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
