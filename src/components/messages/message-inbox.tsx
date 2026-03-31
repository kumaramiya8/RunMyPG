'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Send,
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  Users,
  Building2,
  User,
  ChevronRight,
  Plus,
  Settings,
  Megaphone,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getMessages } from '@/lib/services/messages'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

type MessageStatus = 'sent' | 'delivered' | 'pending' | 'failed'
type RecipientType = 'all' | 'building' | 'floor' | 'tenant'

const statusConfig: Record<MessageStatus, { icon: typeof CheckCheck; label: string; color: string }> = {
  delivered: { icon: CheckCheck, label: 'Delivered', color: 'text-emerald-500' },
  sent: { icon: Send, label: 'Sent', color: 'text-blue-500' },
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-500' },
  failed: { icon: AlertCircle, label: 'Failed', color: 'text-red-500' },
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: 'Announcement', color: 'text-blue-600', bg: 'bg-blue-50' },
  rent_reminder: { label: 'Rent Reminder', color: 'text-amber-600', bg: 'bg-amber-50' },
  complaint_update: { label: 'Complaint Update', color: 'text-purple-600', bg: 'bg-purple-50' },
  custom: { label: 'Custom', color: 'text-slate-600', bg: 'bg-slate-100' },
}

const recipientIcons: Record<string, typeof Users> = {
  all: Users,
  building: Building2,
  floor: Building2,
  tenant: User,
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

type FilterType = 'all' | 'announcement' | 'rent_reminder'

export default function MessageInbox() {
  const { orgId } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: messages, loading, error } = useQuery(
    () => getMessages(orgId!),
    [orgId]
  )

  if (!orgId) return null
  if (loading) return <ListSkeleton rows={5} />
  if (error) return <div className="text-center py-10"><p className="text-sm text-red-500">Error: {error}</p></div>

  const allMessages = messages || []

  const filtered = filter === 'all'
    ? allMessages
    : allMessages.filter((m: any) => m.message_type === filter)

  const totalSent = allMessages.length
  const deliveredCount = allMessages.filter((m: any) => m.delivery_status === 'delivered').length

  if (allMessages.length === 0) {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <Link
            href="/more/messages/new"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <Megaphone className="w-4 h-4" />
            New Broadcast
          </Link>
          <Link
            href="/more/messages/reminders"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <Bell className="w-4 h-4" />
            Auto Reminders
          </Link>
        </div>
        <EmptyState icon={MessageSquare} title="No Messages Yet" description="Send your first broadcast to get started" />
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Messages Sent</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{totalSent}</p>
          <p className="text-[10px] text-slate-400">This month</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Delivered</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 0}%</p>
          <p className="text-[10px] text-slate-400">{deliveredCount} of {totalSent}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/more/messages/new"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          <Megaphone className="w-4 h-4" />
          New Broadcast
        </Link>
        <Link
          href="/more/messages/reminders"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <Bell className="w-4 h-4" />
          Auto Reminders
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'announcement' as const, label: 'Announcements' },
          { key: 'rent_reminder' as const, label: 'Rent Reminders' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === item.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="space-y-2">
        {filtered.map((msg: any) => {
          const status = (msg.delivery_status || 'sent') as MessageStatus
          const stCfg = statusConfig[status] || statusConfig.sent
          const StatusIcon = stCfg.icon
          const msgType = msg.message_type || 'custom'
          const tCfg = typeConfig[msgType] || typeConfig.custom
          const recipientType = (msg.recipient_type || 'all') as string
          const RecipientIcon = recipientIcons[recipientType] || Users

          return (
            <div
              key={msg.id}
              className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${tCfg.bg} ${tCfg.color}`}>
                  {tCfg.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={`w-3.5 h-3.5 ${stCfg.color}`} />
                  <span className="text-[10px] text-slate-400">{msg.sent_at ? timeAgo(msg.sent_at) : ''}</span>
                </div>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed mb-2 line-clamp-2">
                {msg.content}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <RecipientIcon className="w-3 h-3" />
                <span>To: {recipientType === 'all' ? 'All Tenants' : recipientType}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
