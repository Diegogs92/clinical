"use client";

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SyncIndicatorProps {
  isSyncing?: boolean;
  lastSyncTime?: Date;
  syncError?: string | null;
  onRetry?: () => void;
  className?: string;
}

export default function SyncIndicator({
  isSyncing = false,
  lastSyncTime,
  syncError,
  onRetry,
  className = ''
}: SyncIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-collapse after 3 seconds when not syncing
  useEffect(() => {
    if (!isSyncing && isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, isExpanded]);

  const getStatusIcon = () => {
    if (syncError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (isSyncing) {
      return <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />;
    }
    if (lastSyncTime) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <CloudOff className="w-4 h-4 text-slate-400" />;
  };

  const getStatusText = () => {
    if (syncError) return 'Error al sincronizar';
    if (isSyncing) return 'Sincronizando...';
    if (lastSyncTime) {
      return `Sincronizado ${formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: es })}`;
    }
    return 'Sin sincronizar';
  };

  const getStatusColor = () => {
    if (syncError) return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    if (isSyncing) return 'bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800';
    if (lastSyncTime) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${getStatusColor()} ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => !isSyncing && setIsExpanded(false)}
      role="status"
      aria-live="polite"
    >
      {getStatusIcon()}

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
        <span className="text-xs font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
          {getStatusText()}
        </span>
      </div>

      {syncError && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline ml-1"
          aria-label="Reintentar sincronización"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
