'use client'

import { AlertTriangle, Zap, Droplets, Sofa, SprayCan } from 'lucide-react'

interface ComplaintItem {
  id: string
  room: string
  category: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved'
  timeAgo: string
}

// Demo data — will be replaced with Supabase queries
const demoComplaints: ComplaintItem[] = [
  {
    id: '1',
    room: 'Room 204',
    category: 'Electrical',
    description: 'Ceiling fan making grinding noise',
    priority: 'high',
    status: 'open',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    room: 'Room 108',
    category: 'Plumbing',
    description: 'Bathroom tap leaking continuously',
    priority: 'medium',
    status: 'in_progress',
    timeAgo: '5h ago',
  },
  {
    id: '3',
    room: 'Room 312',
    category: 'Furniture',
    description: 'Bed frame is broken, needs replacement',
    priority: 'urgent',
    status: 'open',
    timeAgo: '1d ago',
  },
  {
    id: '4',
    room: 'Room 105',
    category: 'Cleaning',
    description: 'Common bathroom needs deep cleaning',
    priority: 'low',
    status: 'open',
    timeAgo: '1d ago',
  },
]

const categoryIcons: Record<string, typeof Zap> = {
  Electrical: Zap,
  Plumbing: Droplets,
  Furniture: Sofa,
  Cleaning: SprayCan,
}

const priorityStyles: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-amber-50 text-amber-600',
  urgent: 'bg-red-50 text-red-600',
}

const statusStyles: Record<string, string> = {
  open: 'bg-red-50 text-red-600',
  in_progress: 'bg-amber-50 text-amber-600',
  resolved: 'bg-emerald-50 text-emerald-600',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export default function RecentComplaints() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">Maintenance Issues</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
          View All
        </button>
      </div>

      <div className="divide-y divide-slate-50">
        {demoComplaints.map((complaint) => {
          const Icon = categoryIcons[complaint.category] || AlertTriangle

          return (
            <div key={complaint.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors active:bg-slate-100 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {complaint.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      {complaint.room}
                    </span>
                    <span className="text-slate-300">&#183;</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityStyles[complaint.priority]}`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyles[complaint.status]}`}>
                      {statusLabels[complaint.status]}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-1">
                  {complaint.timeAgo}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
