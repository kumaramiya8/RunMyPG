'use client'

import { useState } from 'react'
import {
  Zap,
  Droplets,
  Sofa,
  SprayCan,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Building2,
  User,
  Calendar,
  MessageSquare,
  UserCog,
  ChevronDown,
  Check,
  X,
  Send,
} from 'lucide-react'
import { mockComplaints, mockTenants, mockRooms } from '@/lib/mock-data'
import type { ComplaintStatus } from '@/lib/types'

const categoryIcons: Record<string, typeof Zap> = {
  Electrical: Zap,
  Plumbing: Droplets,
  Furniture: Sofa,
  Cleaning: SprayCan,
}

const categoryColors: Record<string, string> = {
  Electrical: 'bg-yellow-50 text-yellow-600',
  Plumbing: 'bg-blue-50 text-blue-600',
  Furniture: 'bg-orange-50 text-orange-600',
  Cleaning: 'bg-teal-50 text-teal-600',
}

const statusConfig: Record<ComplaintStatus, { icon: typeof Clock; label: string; color: string; bg: string; border: string }> = {
  open: { icon: AlertTriangle, label: 'Open', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  in_progress: { icon: Loader2, label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  resolved: { icon: CheckCircle, label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  closed: { icon: CheckCircle, label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Priority', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium Priority', color: 'bg-blue-50 text-blue-600' },
  high: { label: 'High Priority', color: 'bg-amber-50 text-amber-600' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-600' },
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Mock activity timeline
function getTimeline(complaint: typeof mockComplaints[0]) {
  const items = [
    { time: complaint.created_at, label: 'Complaint submitted', icon: AlertTriangle, color: 'text-red-500' },
  ]
  if (complaint.assigned_to) {
    items.push({
      time: new Date(new Date(complaint.created_at).getTime() + 3600000).toISOString(),
      label: `Assigned to ${complaint.assigned_to}`,
      icon: UserCog,
      color: 'text-amber-500',
    })
  }
  if (complaint.status === 'in_progress') {
    items.push({
      time: new Date(new Date(complaint.created_at).getTime() + 7200000).toISOString(),
      label: 'Work in progress',
      icon: Loader2,
      color: 'text-amber-500',
    })
  }
  if (complaint.status === 'resolved' && complaint.resolved_at) {
    items.push({
      time: complaint.resolved_at,
      label: 'Issue resolved',
      icon: CheckCircle,
      color: 'text-emerald-500',
    })
  }
  return items
}

export default function ComplaintDetail({ complaintId }: { complaintId: string }) {
  const [showAssign, setShowAssign] = useState(false)
  const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')

  const complaint = mockComplaints.find((c) => c.id === complaintId)
  if (!complaint) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-400">Complaint not found</p>
      </div>
    )
  }

  const tenant = complaint.tenant_id ? mockTenants.find((t) => t.id === complaint.tenant_id) : undefined
  const room = complaint.room_id ? mockRooms.find((r) => r.id === complaint.room_id) : undefined
  const CatIcon = categoryIcons[complaint.category] || AlertTriangle
  const catColor = categoryColors[complaint.category] || 'bg-slate-50 text-slate-500'
  const stCfg = statusConfig[complaint.status]
  const StatusIcon = stCfg.icon
  const priCfg = priorityConfig[complaint.priority] || priorityConfig.medium
  const timeline = getTimeline(complaint)

  return (
    <div className="space-y-4">
      {/* Status banner + main info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`px-4 py-3 ${stCfg.bg} border-b ${stCfg.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${stCfg.color}`} />
            <span className={`text-sm font-semibold ${stCfg.color}`}>{stCfg.label}</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${priCfg.color}`}>
            {priCfg.label}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${catColor} shrink-0`}>
              <CatIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{complaint.category}</p>
              <p className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{complaint.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Building2 className="w-3 h-3" /> Location
              </div>
              <p className="text-xs font-semibold text-slate-700">{room?.name || 'Unknown'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <User className="w-3 h-3" /> Reported by
              </div>
              <p className="text-xs font-semibold text-slate-700">{tenant?.full_name || 'Unknown'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Calendar className="w-3 h-3" /> Reported
              </div>
              <p className="text-xs font-semibold text-slate-700">{formatDateTime(complaint.created_at)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <UserCog className="w-3 h-3" /> Assigned to
              </div>
              <p className="text-xs font-semibold text-slate-700">{complaint.assigned_to || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity</h3>
        <div className="space-y-4">
          {timeline.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-200" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(item.time)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</h3>

          {/* Assign */}
          {!complaint.assigned_to && (
            <div>
              {!showAssign ? (
                <button
                  onClick={() => setShowAssign(true)}
                  className="w-full py-2.5 bg-amber-50 text-amber-700 font-semibold rounded-xl text-sm border border-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <UserCog className="w-4 h-4" />
                  Assign to Someone
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Raju (Electrician)"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button className="px-4 py-2.5 bg-amber-500 text-white font-semibold rounded-xl text-sm hover:bg-amber-600 active:scale-[0.98] transition-all">
                    Assign
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add note */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a note or update..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <Send className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Mark resolved */}
          <button className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Mark as Resolved
          </button>
        </div>
      )}

      {/* Notify tenant */}
      <button className="w-full py-2.5 bg-white text-primary font-semibold rounded-xl text-sm border border-primary/20 hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Notify Tenant via WhatsApp
      </button>
    </div>
  )
}
