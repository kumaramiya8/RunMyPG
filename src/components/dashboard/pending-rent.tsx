'use client'

import { Clock, ChevronRight } from 'lucide-react'

interface PendingRentItem {
  id: string
  tenantName: string
  room: string
  amount: number
  dueDate: string
  daysOverdue: number
}

// Demo data — will be replaced with Supabase queries
const demoPendingRents: PendingRentItem[] = [
  {
    id: '1',
    tenantName: 'Rahul Sharma',
    room: 'Room 201',
    amount: 8500,
    dueDate: '25 Mar',
    daysOverdue: 6,
  },
  {
    id: '2',
    tenantName: 'Priya Patel',
    room: 'Room 304',
    amount: 7000,
    dueDate: '28 Mar',
    daysOverdue: 3,
  },
  {
    id: '3',
    tenantName: 'Suresh Kumar',
    room: 'Room 102',
    amount: 9000,
    dueDate: '01 Apr',
    daysOverdue: 0,
  },
  {
    id: '4',
    tenantName: 'Anita Desai',
    room: 'Room 207',
    amount: 7500,
    dueDate: '01 Apr',
    daysOverdue: 0,
  },
]

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PendingRent() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">Pending Rent</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
          View All
        </button>
      </div>

      <div className="divide-y divide-slate-50">
        {demoPendingRents.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors active:bg-slate-100 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {item.tenantName}
                </p>
                {item.daysOverdue > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {item.daysOverdue}d late
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {item.room} &middot; Due {item.dueDate}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-900">
                {formatINR(item.amount)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
