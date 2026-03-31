'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Droplets,
  Zap,
  UtensilsCrossed,
  Wrench,
  Wifi,
  SprayCan,
  UserCog,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getExpenses } from '@/lib/services/billing'
import { ListSkeleton, CardSkeleton } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const categoryIcons: Record<string, typeof Droplets> = {
  Water: Droplets,
  Electricity: Zap,
  Food: UtensilsCrossed,
  Maintenance: Wrench,
  'Wi-Fi': Wifi,
  Cleaning: SprayCan,
  Staff: UserCog,
}

const categoryColors: Record<string, string> = {
  Water: 'bg-blue-50 text-blue-600',
  Electricity: 'bg-yellow-50 text-yellow-600',
  Food: 'bg-orange-50 text-orange-600',
  Maintenance: 'bg-red-50 text-red-600',
  'Wi-Fi': 'bg-indigo-50 text-indigo-600',
  Cleaning: 'bg-teal-50 text-teal-600',
  Staff: 'bg-purple-50 text-purple-600',
}

type FilterCat = 'all' | string

export default function ExpenseList() {
  const { orgId } = useAuth()
  const [filter, setFilter] = useState<FilterCat>('all')

  const { data: expenses, loading } = useQuery(
    () => getExpenses(orgId!),
    [orgId]
  )

  if (!orgId || loading) {
    return (
      <div>
        <CardSkeleton />
        <div className="mt-4"><ListSkeleton rows={5} /></div>
      </div>
    )
  }

  const allExpenses = expenses || []

  // Get unique categories
  const categories = [...new Set(allExpenses.map((e: any) => e.category))]

  const filtered = filter === 'all'
    ? allExpenses
    : allExpenses.filter((e: any) => e.category === filter)

  const totalAmount = filtered.reduce((s: number, e: any) => s + Number(e.amount), 0)

  // Group by date
  const grouped: Record<string, any[]> = {}
  filtered.forEach((exp: any) => {
    const date = exp.expense_date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(exp)
  })

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {/* Summary & Add button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{formatINR(totalAmount)}</p>
          <p className="text-xs text-slate-500">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} this month
          </p>
        </div>
        <Link
          href="/bills/expenses/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-touch -mx-4 px-4 md:mx-0 md:px-0 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {categories.map((cat: string) => {
          const count = allExpenses.filter((e: any) => e.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Expense list grouped by date */}
      <div className="space-y-4">
        {sortedDates.map((date) => {
          const dayExpenses = grouped[date]
          const dayTotal = dayExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0)
          const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })

          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">{formattedDate}</span>
                <span className="text-xs font-bold text-slate-600">{formatINR(dayTotal)}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
                {dayExpenses.map((expense: any) => {
                  const Icon = categoryIcons[expense.category] || HelpCircle
                  const color = categoryColors[expense.category] || 'bg-slate-50 text-slate-500'
                  return (
                    <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{expense.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{expense.category}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 shrink-0">{formatINR(expense.amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
