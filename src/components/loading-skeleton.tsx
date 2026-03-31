'use client'

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
  )
}
