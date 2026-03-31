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
} from 'lucide-react'

type MessageStatus = 'sent' | 'delivered' | 'pending' | 'failed'
type RecipientType = 'all' | 'building' | 'tenant'

interface MockMessage {
  id: string
  type: 'announcement' | 'rent_reminder' | 'complaint_update' | 'custom'
  recipientType: RecipientType
  recipientLabel: string
  content: string
  sentAt: string
  status: MessageStatus
}

const mockMessages: MockMessage[] = [
  { id: 'm1', type: 'announcement', recipientType: 'all', recipientLabel: 'All Tenants (39)', content: 'No water supply from 2 PM to 4 PM today due to tank cleaning. Please store water in advance.', sentAt: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'delivered' },
  { id: 'm2', type: 'rent_reminder', recipientType: 'all', recipientLabel: 'Pending Rent (16)', content: 'Friendly reminder: Your rent for March is due. Please pay at your earliest convenience to avoid late fees.', sentAt: new Date(Date.now() - 24 * 3600000).toISOString(), status: 'delivered' },
  { id: 'm3', type: 'complaint_update', recipientType: 'tenant', recipientLabel: 'Rahul Sharma', content: 'Your complaint about the ceiling fan in Room 204 has been assigned to our electrician. Expected fix by tomorrow.', sentAt: new Date(Date.now() - 5 * 3600000).toISOString(), status: 'sent' },
  { id: 'm4', type: 'announcement', recipientType: 'all', recipientLabel: 'All Tenants (39)', content: 'Monthly pest control scheduled for this Saturday 10 AM. Please keep your rooms accessible.', sentAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'delivered' },
  { id: 'm5', type: 'rent_reminder', recipientType: 'tenant', recipientLabel: 'Vikram Singh', content: 'Your rent of ₹8,000 is 5 days overdue. Please clear the payment immediately to avoid penalties.', sentAt: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'delivered' },
  { id: 'm6', type: 'custom', recipientType: 'all', recipientLabel: 'All Tenants (39)', content: 'Holi celebration in the common area this Sunday at 4 PM! Colours and refreshments will be provided.', sentAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'delivered' },
  { id: 'm7', type: 'rent_reminder', recipientType: 'all', recipientLabel: 'Pending Rent (12)', content: 'This is an auto-reminder: Your rent is due in 3 days. Please ensure timely payment.', sentAt: new Date(Date.now() - 6 * 86400000).toISOString(), status: 'delivered' },
]

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

const recipientIcons: Record<RecipientType, typeof Users> = {
  all: Users,
  building: Building2,
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
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all'
    ? mockMessages
    : mockMessages.filter((m) => m.type === filter)

  const totalSent = mockMessages.length
  const deliveredCount = mockMessages.filter((m) => m.status === 'delivered').length

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
          <p className="text-xl font-bold text-emerald-600">{Math.round((deliveredCount / totalSent) * 100)}%</p>
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
        {filtered.map((msg) => {
          const stCfg = statusConfig[msg.status]
          const StatusIcon = stCfg.icon
          const tCfg = typeConfig[msg.type]
          const RecipientIcon = recipientIcons[msg.recipientType]

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
                  <span className="text-[10px] text-slate-400">{timeAgo(msg.sentAt)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed mb-2 line-clamp-2">
                {msg.content}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <RecipientIcon className="w-3 h-3" />
                <span>To: {msg.recipientLabel}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
