"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      aria-live="polite"
      aria-busy="true"
    />
  );
}

export function PatientCardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentCardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5, className = '' }: { columns?: number; className?: string }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsCardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <TableSkeleton rows={5} columns={4} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientListSkeleton({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <PatientCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CalendarSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 5, className = '' }: { fields?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}
