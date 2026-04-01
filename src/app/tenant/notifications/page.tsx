'use client'

import { useState } from 'react'
import {
  Bell,
  IndianRupee,
  Receipt,
  Clock,
  AlertTriangle,
  MessageCircleWarning,
  Megaphone,
  Info,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getNotificationsForTenant, markNotificationRead } from '@/lib/services/notifications'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

type NotificationType = 'payment' | 'receipt' | 'reminder' | 'notice' | 'complaint' | 'broadcast' | 'info'

const typeConfig: Record<NotificationType, { label: string; icon: typeof Bell; color: string; bg: string; dot: string }> = {
  payment:   { label: 'Payment',     icon: IndianRupee,          color: 'text-emerald-600', bg: 'bg-emerald-50',  dot: 'bg-emerald-500' },
  receipt:   { label: 'Receipt',     icon: Receipt,              color: 'text-blue-600',    bg: 'bg-blue-50',     dot: 'bg-blue-500' },
  reminder:  { label: 'Reminder',    icon: Clock,                color: 'text-amber-600',   bg: 'bg-amber-50',    dot: 'bg-amber-500' },
  notice:    { label: 'Notice',      icon: AlertTriangle,        color: 'text-red-600',     bg: 'bg-red-50',      dot: 'bg-red-500' },
  complaint: { label: 'Complaint',   icon: MessageCircleWarning, color: 'text-purple-600',  bg: 'bg-purple-50',   dot: 'bg-purple-500' },
  broadcast: { label: 'Broadcast',   icon: Megaphone,            color: 'text-indigo-600',  bg: 'bg-indigo-50',   dot: 'bg-indigo-500' },
  info:      { label: 'Info',        icon: Info,                 color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-500' },
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function TenantNotificationsPage() {
  const { orgId, tenantId } = useAuth()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const { data: notifications, loading, refetch } = useQuery(
    async () => {
      if (!orgId || !tenantId) return []
      return getNotificationsForTenant(tenantId, orgId)
    },
    [orgId, tenantId]
  )

  const handleMarkRead = async (id: string) => {
    if (readIds.has(id)) return
    try {
      await markNotificationRead(id)
      setReadIds((prev) => new Set(prev).add(id))
    } catch {
      // silently fail
    }
  }

  if (!orgId || !tenantId) return null

  const items = notifications || []

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-slate-700" />
        <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Notifications from your PG will appear here" />
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => {
            const cfg = typeConfig[(n.type as NotificationType)] || typeConfig.info
            const Icon = cfg.icon
            const isRead = n.read || readIds.has(n.id)

            return (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  isRead ? 'border-slate-100 opacity-75' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    {!isRead && (
                      <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${cfg.dot} ring-2 ring-white`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold ${cfg.color} ${cfg.bg} px-2 py-0.5 rounded-full`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
