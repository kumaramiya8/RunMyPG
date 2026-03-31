'use client'

import { useState } from 'react'
import {
  Bell,
  Megaphone,
  IndianRupee,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

type FilterType = 'all' | 'announcement' | 'rent_reminder'

const typeConfig: Record<string, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  announcement: { label: 'Announcement', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
  rent_reminder: { label: 'Rent Reminder', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
  complaint_update: { label: 'Complaint Update', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  custom: { label: 'Message', icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
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

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'rent_reminder', label: 'Rent Reminders' },
]

export default function TenantNotificationsPage() {
  const { orgId, tenantId } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: messages, loading } = useQuery(
    async () => {
      if (!orgId || !tenantId) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_type.eq.all,and(recipient_type.eq.tenant,recipient_id.eq.${tenantId})`)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    [orgId, tenantId]
  )

  const filtered = filter === 'all'
    ? (messages || [])
    : (messages || []).filter((m: any) => m.message_type === filter)

  if (!orgId || !tenantId) return null

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-slate-700" />
        <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Messages from your PG will appear here" />
      ) : (
        <div className="space-y-2">
          {filtered.map((msg: any) => {
            const cfg = typeConfig[msg.message_type] || typeConfig.custom
            const Icon = cfg.icon
            return (
              <div
                key={msg.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold ${cfg.color} ${cfg.bg} px-2 py-0.5 rounded-full`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(msg.created_at || msg.sent_at)}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {formatFullDate(msg.created_at || msg.sent_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
